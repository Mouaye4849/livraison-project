import { useEffect, useRef, useState } from "react";
import { Navigation, AlertTriangle, Loader2, RefreshCw, Crosshair } from "lucide-react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { getGpsLatest } from "../services/gps.service";
import { createStompClient } from "../services/ws.service";

/* ─── CSS: marker animations + Leaflet dark skin ───────────────────────────── */
const GPS_CSS = `
@keyframes gps-ring-expand {
  0%   { transform: scale(1);   opacity: 0.80; }
  80%  { transform: scale(3.5); opacity: 0;    }
  100% { transform: scale(3.5); opacity: 0;    }
}
@keyframes gps-dot-pulse {
  0%, 100% { box-shadow: 0 0 0 0   rgba(34,197,94,0.70); }
  50%       { box-shadow: 0 0 0 10px rgba(34,197,94,0);   }
}
.gps-ring { animation: gps-ring-expand 2.4s ease-out infinite; }
.gps-dot  { animation: gps-dot-pulse  2.0s ease-in-out infinite; }

/* ── Leaflet zoom dark skin ── */
.leaflet-control-zoom {
  border: none !important;
  border-radius: 14px !important;
  overflow: hidden;
  box-shadow: 0 8px 32px rgba(0,0,0,0.55) !important;
}
.leaflet-control-zoom a {
  background: rgba(10,13,18,0.84) !important;
  backdrop-filter: blur(16px) !important;
  color: #d1d5db !important;
  border-color: rgba(255,255,255,0.08) !important;
  width: 34px !important; height: 34px !important; line-height: 32px !important;
  font-size: 16px !important; font-weight: 600 !important;
}
.leaflet-control-zoom a:hover {
  background: rgba(255,255,255,0.12) !important;
  color: #fff !important;
}
.leaflet-control-attribution {
  background: rgba(10,13,18,0.55) !important;
  backdrop-filter: blur(8px) !important;
  color: rgba(255,255,255,0.28) !important;
  font-size: 9px !important;
  border-radius: 8px 0 0 0 !important;
  padding: 2px 6px !important;
}
.leaflet-control-attribution a { color: rgba(255,255,255,0.42) !important; }
.leaflet-popup-content-wrapper {
  background: rgba(10,13,18,0.90) !important;
  backdrop-filter: blur(16px) !important;
  color: #f0f6fc !important;
  border-radius: 14px !important;
  border: 1px solid rgba(255,255,255,0.10) !important;
  box-shadow: 0 8px 32px rgba(0,0,0,0.5) !important;
}
.leaflet-popup-tip { background: rgba(10,13,18,0.90) !important; }
`;

/* ─── Animated GPS marker (green) ──────────────────────────────────────────── */
function makeMarkerIcon() {
    return L.divIcon({
        className: "",
        html: `
          <div style="position:relative;width:44px;height:44px;display:flex;align-items:center;justify-content:center;">
            <div class="gps-ring" style="
              position:absolute;inset:0;border-radius:50%;
              background:rgba(34,197,94,0.16);border:1.5px solid rgba(34,197,94,0.42);
            "></div>
            <div class="gps-dot" style="
              width:18px;height:18px;border-radius:50%;
              background:#22c55e;border:3px solid #fff;
              position:relative;z-index:1;
              box-shadow:0 2px 14px rgba(34,197,94,0.65),0 0 0 0 rgba(34,197,94,0.7);
            "></div>
          </div>
        `,
        iconSize:   [44, 44],
        iconAnchor: [22, 22],
    });
}

/* ─── Glassmorphism helper (inline style object) ───────────────────────────── */
const glass = (alpha = 0.82) => ({
    backdropFilter:       'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    background:           `rgba(10,13,18,${alpha})`,
    border:               '1px solid rgba(255,255,255,0.09)',
});

/* ─── Component ─────────────────────────────────────────────────────────────── */
export default function GpsMap({ colisId }) {

    const [gpsData,     setGpsData]     = useState(null);
    const [loading,     setLoading]     = useState(true);
    const [errorType,   setErrorType]   = useState(null); // "no_gps" | "error" | null
    const [lastUpdated, setLastUpdated] = useState(null);
    const [refreshing,  setRefreshing]  = useState(false);
    const [isMoving,    setIsMoving]    = useState(false);

    const mapContainerRef = useRef(null);
    const mapRef          = useRef(null);
    const markerRef       = useRef(null);
    const cssRef          = useRef(false);

    /* ── Inject CSS once ────────────────────────────────────────────────────── */
    useEffect(() => {
        if (cssRef.current) return;
        const el = document.createElement("style");
        el.textContent = GPS_CSS;
        document.head.appendChild(el);
        cssRef.current = true;
    }, []);

    /* ── REST fetch for last known position ─────────────────────────────────── */
    const fetchGps = (manual = false) => {
        if (manual) setRefreshing(true);
        console.log(`[GPS-MAP] REST: fetching last known position for colisId=${colisId}`);
        getGpsLatest(colisId)
            .then(res => {
                const data = res.data;
                console.log(`[GPS-MAP] REST: got position lat=${data.latitude} lon=${data.longitude}`);
                setGpsData(prev => {
                    if (prev) {
                        const moved =
                            Math.abs(data.latitude  - prev.latitude)  > 0.00005 ||
                            Math.abs(data.longitude - prev.longitude) > 0.00005;
                        setIsMoving(moved);
                    }
                    return data;
                });
                setErrorType(null);
                setLastUpdated(new Date());
            })
            .catch(err => {
                const status = err.response?.status;
                console.warn(`[GPS-MAP] REST: failed HTTP ${status} — ${status === 404 ? "no GPS data yet" : "network/auth error"}`);
                if (status === 404) setErrorType("no_gps");
                else setErrorType("error");
            })
            .finally(() => {
                setLoading(false);
                if (manual) setRefreshing(false);
            });
    };

    /* ── Polling fallback: retry REST every 15 s until GPS data arrives ─────── */
    useEffect(() => {
        if (!colisId) return;
        // Only poll while we have no data yet. Once gpsData is set (either from REST
        // or STOMP), the interval clears itself. This handles the race condition where
        // the client opens the tracking page before the Voyageur's first GPS update
        // is persisted to the DB.
        const intervalId = setInterval(() => {
            setGpsData(current => {
                if (current) {
                    clearInterval(intervalId);
                    return current;
                }
                console.log(`[GPS-MAP] REST poll: no data yet, retrying…`);
                fetchGps();
                return current;
            });
        }, 15_000);

        return () => clearInterval(intervalId);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [colisId]);

    /* ── STOMP real-time subscription (unchanged logic) ─────────────────────── */
    useEffect(() => {
        if (!colisId) return;
        fetchGps();
        let mounted = true;
        const topic = `/topic/gps/${colisId}`;
        const client = createStompClient(() => {
            console.log(`[GPS-MAP] STOMP connected — subscribing to ${topic}`);
            client.subscribe(topic, (msg) => {
                if (!mounted) return;
                try {
                    const data = JSON.parse(msg.body);
                    console.log(`[GPS-MAP] STOMP: received GPS frame lat=${data.latitude} lon=${data.longitude}`);
                    setGpsData(prev => {
                        if (prev) {
                            const moved =
                                Math.abs(data.latitude  - prev.latitude)  > 0.00005 ||
                                Math.abs(data.longitude - prev.longitude) > 0.00005;
                            setIsMoving(moved);
                        }
                        return data;
                    });
                    setErrorType(null);
                    setLoading(false);
                    setLastUpdated(new Date());
                } catch (e) {
                    console.warn('[GPS-MAP] Malformed GPS frame:', msg.body);
                }
            });
        });
        client.activate();
        return () => { mounted = false; client.deactivate(); };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [colisId]);

    /* ── Initialize Leaflet with dark tiles ─────────────────────────────────── */
    useEffect(() => {
        if (!mapContainerRef.current || mapRef.current) return;
        const map = L.map(mapContainerRef.current, {
            zoomControl:        false,
            scrollWheelZoom:    true,
            attributionControl: true,
        });
        L.tileLayer(
            "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
            {
                maxZoom:     19,
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com">CARTO</a>',
            }
        ).addTo(map);
        L.control.zoom({ position: "bottomright" }).addTo(map);
        map.setView([20, 10], 2);
        mapRef.current = map;
        setTimeout(() => map.invalidateSize(), 150);
        return () => {
            map.remove();
            mapRef.current    = null;
            markerRef.current = null;
        };
    }, []);

    /* ── Animate marker to new position ─────────────────────────────────────── */
    useEffect(() => {
        if (!mapRef.current || !gpsData) return;
        const { latitude, longitude } = gpsData;
        const latlng = [latitude, longitude];
        if (markerRef.current) {
            markerRef.current.setLatLng(latlng);
        } else {
            markerRef.current = L.marker(latlng, { icon: makeMarkerIcon() })
                .bindPopup(
                    `<div style="text-align:center;padding:4px 2px">
                       <div style="color:#22c55e;font-weight:700;font-size:13px;margin-bottom:3px">🚚 Voyageur</div>
                       <div style="color:#9ca3af;font-size:11px">Position en temps réel</div>
                     </div>`,
                    { maxWidth: 180 }
                )
                .addTo(mapRef.current);
        }
        const currentZoom = mapRef.current.getZoom();
        mapRef.current.setView(latlng, currentZoom < 12 ? 13 : currentZoom, {
            animate: true,
            duration: 0.9,
        });
    }, [gpsData]);

    /* ── Helpers ────────────────────────────────────────────────────────────── */
    const fmtTime  = (d) =>
        d?.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", second: "2-digit" }) ?? "";

    const centerMap = () => {
        if (!mapRef.current || !gpsData) return;
        mapRef.current.setView([gpsData.latitude, gpsData.longitude], 15, {
            animate: true, duration: 0.8,
        });
    };

    const showMap = !loading && !errorType;

    /* ── Render ─────────────────────────────────────────────────────────────── */
    return (
        <div
            className="relative overflow-hidden rounded-2xl shadow-2xl"
            style={{
                height:     'calc(100vh - 220px)',
                minHeight:  '500px',
                background: '#0a0d12',
                border:     '1px solid rgba(255,255,255,0.06)',
            }}
        >
            {/* ── Leaflet canvas ─────────────────────────────────────────────────── */}
            <div ref={mapContainerRef} className="absolute inset-0" style={{ zIndex: 0 }} />

            {/* ── Loading overlay ─────────────────────────────────────────────────── */}
            {loading && (
                <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-5"
                     style={{ background: 'rgba(10,13,18,0.95)' }}>
                    <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
                         style={glass(0.06)}>
                        <Loader2 size={28} className="text-green-400 animate-spin" />
                    </div>
                    <p className="text-gray-400 text-sm font-medium">Localisation du voyageur…</p>
                </div>
            )}

            {/* ── No GPS overlay ──────────────────────────────────────────────────── */}
            {!loading && errorType === "no_gps" && (
                <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-6 text-center px-12"
                     style={{ background: 'rgba(10,13,18,0.92)' }}>
                    <div className="w-[72px] h-[72px] rounded-2xl flex items-center justify-center"
                         style={glass(0.05)}>
                        <Navigation size={30} className="text-gray-400" />
                    </div>
                    <div>
                        <p className="text-white/75 font-bold text-base">En attente du voyageur</p>
                        <p className="text-gray-500 text-sm mt-2 leading-relaxed max-w-xs mx-auto">
                            La position GPS sera disponible dès que la livraison commencera.
                        </p>
                    </div>
                </div>
            )}

            {/* ── Error overlay ────────────────────────────────────────────────────── */}
            {!loading && errorType === "error" && (
                <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-5"
                     style={{ background: 'rgba(10,13,18,0.92)' }}>
                    <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
                         style={{ background: 'rgba(220,38,38,0.10)', border: '1px solid rgba(220,38,38,0.20)' }}>
                        <AlertTriangle size={26} className="text-red-400" />
                    </div>
                    <p className="text-gray-400 text-sm">Impossible de récupérer la position GPS</p>
                    <button
                        onClick={() => fetchGps(true)}
                        className="px-5 py-2 rounded-xl text-sm font-bold transition hover:scale-105"
                        style={{ background: 'rgba(34,197,94,0.10)', border: '1px solid rgba(34,197,94,0.22)', color: '#22c55e' }}
                    >
                        Réessayer
                    </button>
                </div>
            )}

            {/* ─────────────── Active map overlays ─────────────────────────────── */}
            {showMap && (
                <>
                    {/* ── Floating top bar ───────────────────────────────────────── */}
                    <div className="absolute top-4 left-4 right-4 z-20 flex items-center justify-between gap-3 pointer-events-none">

                        {/* Left pill */}
                        <div className="pointer-events-auto flex items-center gap-3 px-4 py-2.5 rounded-2xl shadow-xl"
                             style={glass()}>
                            <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse shrink-0" />
                                <span className="text-white font-bold text-sm tracking-tight">Suivi en direct</span>
                            </div>
                            {colisId && (
                                <span className="text-gray-500 text-xs font-mono px-2 py-0.5 rounded-lg"
                                      style={{ background: 'rgba(255,255,255,0.06)' }}>
                                    #{String(colisId).slice(0, 8).toUpperCase()}
                                </span>
                            )}
                        </div>

                        {/* Right: timestamp + refresh */}
                        <div className="pointer-events-auto flex items-center gap-2.5 px-3 py-2 rounded-2xl shadow-xl"
                             style={glass()}>
                            {lastUpdated && (
                                <span className="text-gray-400 text-xs font-mono">{fmtTime(lastUpdated)}</span>
                            )}
                            <button
                                onClick={() => fetchGps(true)}
                                disabled={refreshing}
                                className="w-7 h-7 flex items-center justify-center rounded-xl transition disabled:opacity-40"
                                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)' }}
                            >
                                <RefreshCw size={12} className={`text-gray-300 ${refreshing ? "animate-spin" : ""}`} />
                            </button>
                        </div>
                    </div>

                    {/* ── Right-side floating action buttons ─────────────────────── */}
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 z-20 flex flex-col gap-3">
                        {/* Center map on marker */}
                        <button
                            onClick={centerMap}
                            title="Centrer"
                            className="w-11 h-11 flex items-center justify-center rounded-2xl shadow-xl transition hover:scale-105 active:scale-95"
                            style={glass(0.80)}
                        >
                            <Crosshair size={18} className="text-white/85" />
                        </button>

                        {/* Manual refresh */}
                        <button
                            onClick={() => fetchGps(true)}
                            disabled={refreshing}
                            title="Actualiser"
                            className="w-11 h-11 flex items-center justify-center rounded-2xl shadow-xl transition hover:scale-105 active:scale-95 disabled:opacity-40"
                            style={glass(0.80)}
                        >
                            <RefreshCw size={15} className={`text-white/85 ${refreshing ? "animate-spin" : ""}`} />
                        </button>

                        {/* Live status badge */}
                        <div
                            className="w-11 h-11 flex items-center justify-center rounded-2xl shadow-xl"
                            style={{ backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', background: 'rgba(34,197,94,0.14)', border: '1px solid rgba(34,197,94,0.30)' }}
                        >
                            <span className="w-3 h-3 rounded-full bg-green-400 animate-pulse" />
                        </div>
                    </div>

                </>
            )}
        </div>
    );
}
