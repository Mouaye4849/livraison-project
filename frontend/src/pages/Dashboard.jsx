import { useEffect, useState } from "react";
import api from "../api";
import TrajetsList from "./TrajetsList";

import {
  Truck,
  Clock,
  TrendingUp,
  Wallet,
  Loader2,
  MapPin,
  ArrowUpRight,
  Package,
} from "lucide-react";

import {
  BarChart,
  Bar,
  XAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { useI18n } from "../i18n/index.jsx";

// ─── StatCard ─────────────────────────────────────────────────────────────────

function StatCard({ title, value, subtitle, icon: Icon, accentColor }) {
  return (
    <div className="
      group relative overflow-hidden
      dark:bg-[#111111] bg-white
      dark:border-gray-800/80 border-gray-100 border
      rounded-2xl p-5
      dark:hover:border-gray-700 hover:border-gray-200
      dark:hover:shadow-xl hover:shadow-md dark:hover:shadow-black/40 hover:shadow-gray-100
      transition-all duration-300 cursor-default
    ">
      {/* Gradient accent top line */}
      <div className={`absolute top-0 left-0 right-0 h-[2px] ${accentColor}`} />

      {/* Subtle glow in dark mode */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300
                      dark:bg-gradient-to-b dark:from-white/[0.02] dark:to-transparent bg-gradient-to-b from-gray-50/50 to-transparent" />

      <div className="relative flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-[11px] font-semibold dark:text-gray-500 text-gray-400 uppercase tracking-widest">
            {title}
          </p>
          <h2 className="text-2xl font-bold dark:text-white text-gray-900 tracking-tight">
            {value}
          </h2>
          <p className="text-xs dark:text-gray-600 text-gray-400">{subtitle}</p>
        </div>

        <div className="p-2.5 rounded-xl dark:bg-white/5 bg-gray-50 dark:group-hover:bg-white/8 group-hover:bg-gray-100 transition-all duration-300 group-hover:scale-110">
          <Icon size={20} className="dark:text-gray-400 text-gray-400" />
        </div>
      </div>
    </div>
  );
}

// ─── StatusBadge ──────────────────────────────────────────────────────────────

function StatusBadge({ status }) {
  const { t } = useI18n();
  const map = {
    EN_COURS: { label: t("dashboard.statusInProgress"), cls: "bg-yellow-500/10 text-yellow-500 border-yellow-500/25" },
    ACCEPTE: { label: t("dashboard.statusAccepted"), cls: "bg-blue-500/10  text-blue-500  border-blue-500/25" },
    LIVRE: { label: t("dashboard.statusDelivered"), cls: "bg-emerald-500/10 text-emerald-500 border-emerald-500/25" },
  };

  const { label, cls } = map[status] ?? {
    label: status,
    cls: "bg-gray-500/10 text-gray-400 border-gray-500/20",
  };

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${cls}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80" />
      {label}
    </span>
  );
}

// ─── CustomTooltip ────────────────────────────────────────────────────────────

function CustomTooltip({ active, payload, label }) {
  const { t } = useI18n();
  if (!active || !payload?.length) return null;
  return (
    <div className="dark:bg-[#1c1c1c] bg-white dark:border-gray-700 border-gray-200 border rounded-xl px-3 py-2.5 text-xs dark:shadow-2xl shadow-lg">
      <p className="dark:text-gray-400 text-gray-500 mb-0.5">{label}</p>
      <p className="dark:text-white text-gray-900 font-semibold">{payload[0].value} {t("dashboard.chartDeliveries")}</p>
    </div>
  );
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export default function Dashboard() {
  const { t } = useI18n();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeBar, setActiveBar] = useState(null);

  useEffect(() => { fetchActiveColis(); }, []);

  const fetchActiveColis = async () => {
    try {
      setLoading(true);
      const res = await api.get("/colis/me");
      setOrders(res.data.filter((c) => ["ACCEPTE", "EN_COURS", "LIVRE"].includes(c.statut)));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const formatCommandeId = (id) => "#LPR-" + id.substring(0, 6).toUpperCase();

  const stats = [
    {
      title: t("dashboard.statDeliveries"),
      value: orders.length,
      subtitle: t("dashboard.statToday"),
      icon: Truck,
      accentColor: "bg-gradient-to-r from-blue-600 to-blue-800",
    },
    {
      title: t("dashboard.statInProgress"),
      value: orders.filter((o) => o.statut === "EN_COURS").length,
      subtitle: t("dashboard.statActiveNow"),
      icon: Clock,
      accentColor: "bg-gradient-to-r from-yellow-500 to-orange-500",
    },
    {
      title: t("dashboard.statSuccessRate"),
      value: "96%",
      subtitle: t("dashboard.statGlobalPerf"),
      icon: TrendingUp,
      accentColor: "bg-gradient-to-r from-emerald-500 to-teal-600",
    },
    {
      title: t("dashboard.statRevenue"),
      value: "84 200 MRU",
      subtitle: t("dashboard.statThisMonth"),
      icon: Wallet,
      accentColor: "bg-gradient-to-r from-red-500 to-red-700",
    },
  ];

  const chartData = [
    { name: t("dashboard.days.mon"), value: 10 },
    { name: t("dashboard.days.tue"), value: 20 },
    { name: t("dashboard.days.wed"), value: 15 },
    { name: t("dashboard.days.thu"), value: 25 },
    { name: t("dashboard.days.fri"), value: 30 },
    { name: t("dashboard.days.sat"), value: 18 },
    { name: t("dashboard.days.sun"), value: 35 },
  ];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3 dark:text-gray-500 text-gray-400">
        <Loader2 size={28} className="animate-spin text-red-500" />
        <p className="text-sm">{t("dashboard.loadingData")}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-0 space-y-6 font-sans">

      {/* ── Page header ── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight dark:text-white text-gray-900">
            {t("dashboard.title")}
          </h1>
          <p className="text-sm dark:text-gray-500 text-gray-400 mt-0.5">
            {t("dashboard.subtitle")}
          </p>
        </div>

        <button
          onClick={fetchActiveColis}
          className="
            flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl
            dark:bg-[#111] bg-white
            dark:border dark:border-gray-800 border border-gray-200
            dark:text-gray-300 text-gray-600
            dark:hover:border-red-500/40 hover:border-red-300
            dark:hover:text-red-400 hover:text-red-500
            dark:hover:bg-red-500/5 hover:bg-red-50
            transition-all duration-200
          "
        >
          <ArrowUpRight size={14} />
          {t("dashboard.refresh")}
        </button>
      </div>

      {/* ── Stats grid ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => <StatCard key={i} {...stat} />)}
      </div>

      {/* ── Chart + Map ── */}
      <div className="grid md:grid-cols-2 gap-4">

        {/* Chart */}
        <div className="dark:bg-[#111111] bg-white dark:border-gray-800/80 border-gray-100 border rounded-2xl p-5">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-sm font-semibold dark:text-white text-gray-900">
                {t("dashboard.chartTitle")}
              </h2>
              <p className="text-xs dark:text-gray-500 text-gray-400 mt-0.5">{t("dashboard.chartWeek")}</p>
            </div>
            <span className="text-xs bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 px-2.5 py-1 rounded-full font-semibold">
              {t("dashboard.chartGrowth")}
            </span>
          </div>

          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData} barSize={28}>
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#6b7280", fontSize: 11 }}
              />
              <Tooltip content={<CustomTooltip />} cursor={false} />
              <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell
                    key={index}
                    fill={
                      activeBar === index
                        ? "#dc2626"
                        : index === chartData.length - 1
                          ? "#1e3a8a"
                          : "#1e293b"
                    }
                    onMouseEnter={() => setActiveBar(index)}
                    onMouseLeave={() => setActiveBar(null)}
                    style={{ transition: "fill 0.2s ease", cursor: "pointer" }}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Map placeholder */}
        <div className="
          dark:bg-[#111111] bg-white
          dark:border-gray-800/80 border-gray-100 border
          rounded-2xl p-5
          flex flex-col items-center justify-center gap-3 min-h-[200px]
        ">
          <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
            <MapPin size={20} className="text-blue-500" />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium dark:text-gray-300 text-gray-700">{t("dashboard.mapTitle")}</p>
            <p className="text-xs dark:text-gray-600 text-gray-400 mt-0.5">{t("dashboard.mapSoon")}</p>
          </div>
        </div>
      </div>

      {/* ── Active orders table ── */}
      <div className="dark:bg-[#111111] bg-white dark:border-gray-800/80 border-gray-100 border rounded-2xl overflow-hidden">

        {/* Table header */}
        <div className="flex items-center justify-between px-6 py-4 dark:border-b dark:border-gray-800/60 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-red-500/10 flex items-center justify-center">
              <Package size={14} className="text-red-500" />
            </div>
            <div>
              <h2 className="text-sm font-semibold dark:text-white text-gray-900">
                {t("dashboard.activeOrders")}
              </h2>
              <p className="text-xs dark:text-gray-500 text-gray-400">
                {orders.length} {t("dashboard.colisInProgress")}
              </p>
            </div>
          </div>
        </div>

        {/* Table body */}
        {orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 dark:text-gray-600 text-gray-400">
            <Package size={32} strokeWidth={1.5} />
            <p className="text-sm">{t("dashboard.noActiveColis")}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left dark:border-b dark:border-gray-800/60 border-b border-gray-100">
                  {[t("dashboard.tableOrder"), t("dashboard.tableTrajet"), t("dashboard.tableStatus"), t("dashboard.tablePrice")].map((h) => (
                    <th key={h} className="px-6 py-3 text-[11px] font-semibold dark:text-gray-500 text-gray-400 uppercase tracking-widest">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody className="dark:divide-y dark:divide-gray-800/40 divide-y divide-gray-50">
                {orders.map((c) => (
                  <tr key={c.id} className="dark:hover:bg-white/[0.02] hover:bg-gray-50 transition-colors duration-150">
                    <td className="px-6 py-4">
                      <span className="font-mono text-xs font-bold text-blue-500">
                        {formatCommandeId(c.id)}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-xs">
                        <span className="dark:text-gray-500 text-gray-400">{c.villeDepart}</span>
                        <span className="dark:text-gray-700 text-gray-300">→</span>
                        <span className="dark:text-white text-gray-900 font-medium">{c.villeArrivee}</span>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <StatusBadge status={c.statut} />
                    </td>

                    <td className="px-6 py-4 text-xs font-medium">
                      {c.prixProposeMRU != null ? (
                        <>
                          <span className="dark:text-white text-gray-900">{c.prixProposeMRU}</span>{" "}
                          <span className="dark:text-gray-500 text-gray-400">MRU</span>
                        </>
                      ) : (
                        <span className="dark:text-gray-700 text-gray-300">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {user?.role === "VOYAGEUR" &&
        <TrajetsList />}


    </div>
  );
}
