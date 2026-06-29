"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import { MapContainer, TileLayer, Marker, Polyline, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const AIRPORT_COORDS: Record<string, [number, number]> = {
  LOWW: [48.1103, 16.5697],
  LFPG: [49.0097, 2.5479],
  WSSS: [1.3644, 103.9915],
  EGLL: [51.4700, -0.4543],
  EDDT: [52.5597, 13.2877],
  LIRF: [41.8003, 12.2389],
  LEMD: [40.4722, -3.5608],
  EHAM: [52.3105, 4.7683],
  EBBR: [50.9014, 4.4844],
  LSZH: [47.4647, 8.5492],
  LSGG: [46.2381, 6.1089],
  LFML: [43.4367, 5.2158],
  LFLL: [45.7256, 5.0811],
  LFMN: [43.6584, 7.2159],
};

const markerIcon = L.divIcon({
  className: "custom-map-marker",
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

function parseSpeed(plan: PlanItem): number {
  const raw = plan.cruise_speed ?? plan.speed ?? "450";
  const parsed = Number.parseInt(String(raw).replace(/[^0-9.]/g, ""), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 450;
}

function interpolatePoint(start: [number, number], end: [number, number], ratio: number): [number, number] {
  return [
    start[0] + (end[0] - start[0]) * ratio,
    start[1] + (end[1] - start[1]) * ratio,
  ];
}

function getRouteDistanceKm(start: [number, number], end: [number, number]) {
  const toRad = (value: number) => (value * Math.PI) / 180;
  const [lat1, lon1] = start;
  const [lat2, lon2] = end;
  const earthRadiusKm = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadiusKm * c;
}

interface PlanItem {
  departure?: string;
  destination?: string;
  callsign?: string;
  speed?: string | null;
  cruise_speed?: string | null;
}

interface FlightMapProps {
  plans?: PlanItem[] | null;
}

interface RouteItem {
  id: string;
  callsign?: string;
  departure: [number, number];
  destination: [number, number];
  color: string;
  speedKnots: number;
}

function FitBounds({ points }: { points: [number, number][] }) {
  const map = useMap();

  useEffect(() => {
    if (!points || points.length === 0) return;

    const bounds = L.latLngBounds(points as any);
    const id = window.setTimeout(() => {
      map.fitBounds(bounds, { padding: [60, 60], maxZoom: 4 });
      map.invalidateSize();
    }, 0);

    return () => window.clearTimeout(id);
  }, [map, points]);

  return null;
}

const COLORS = ["#00d2ff", "#ff7a00", "#8b5cf6", "#10b981"];

export default function FlightMap({ plans }: FlightMapProps) {
  const [progressByRoute, setProgressByRoute] = useState<Record<string, number>>({});

  const validRoutes = useMemo(() => {
    if (!plans) return [] as RouteItem[];
    return plans
      .map((p, idx) => {
        const d = p.departure ? AIRPORT_COORDS[p.departure] : undefined;
        const dest = p.destination ? AIRPORT_COORDS[p.destination] : undefined;
        if (!d || !dest) return null;
        return {
          id: `${p.callsign || "plan"}-${idx}`,
          callsign: p.callsign,
          departure: d,
          destination: dest,
          color: COLORS[idx % COLORS.length],
          speedKnots: parseSpeed(p),
        };
      })
      .filter(Boolean) as RouteItem[];
  }, [plans]);

  useEffect(() => {
    if (!validRoutes.length) {
      setProgressByRoute({});
      return;
    }

    let frameId = 0;
    const startTime = performance.now();

    const animate = (now: number) => {
      const elapsedMs = now - startTime;
      setProgressByRoute((prev) => {
        const next = { ...prev };
        validRoutes.forEach((route) => {
          const distanceKm = getRouteDistanceKm(route.departure, route.destination);
          const durationMs = Math.max(15000, (distanceKm / (route.speedKnots * 1.852)) * 3600 * 1000);
          const progress = (elapsedMs % durationMs) / durationMs;
          next[route.id] = progress;
        });
        return next;
      });
      frameId = window.requestAnimationFrame(animate);
    };

    frameId = window.requestAnimationFrame(animate);
    return () => window.cancelAnimationFrame(frameId);
  }, [validRoutes]);

  const allPoints = useMemo(() => {
    const pts: [number, number][] = [];
    validRoutes.forEach((r) => {
      pts.push(r.departure);
      pts.push(r.destination);
    });
    return pts;
  }, [validRoutes]);

  const center = useMemo(() => {
    if (allPoints.length === 0) return [20, 0] as [number, number];
    const lat = allPoints.reduce((s, p) => s + p[0], 0) / allPoints.length;
    const lon = allPoints.reduce((s, p) => s + p[1], 0) / allPoints.length;
    return [lat, lon] as [number, number];
  }, [allPoints]);

  return (
    <div className="rounded overflow-hidden border border-zinc-200 dark:border-zinc-700" style={{ minHeight: "24rem" }}>
      <MapContainer center={center} zoom={allPoints.length ? 3 : 2} scrollWheelZoom={true} style={{ height: "24rem", width: "100%" }}>
        <TileLayer
          attribution='Tiles &copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics, and the GIS User Community'
          url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
        />
        {validRoutes.map((r) => {
          const planePosition = interpolatePoint(r.departure, r.destination, progressByRoute[r.id] ?? 0);
          const planeIcon = L.divIcon({
            html: `<div style="font-size: 22px; transform: rotate(${Math.atan2(r.destination[1] - r.departure[1], r.destination[0] - r.departure[0]) * (180 / Math.PI)}deg);">✈️</div>`,
            className: "plane-marker",
            iconSize: [24, 24],
            iconAnchor: [12, 12],
          });

          return (
            <Fragment key={r.id}>
              <Marker position={r.departure} icon={markerIcon}>
                <Popup>{r.callsign || "DEP"}</Popup>
              </Marker>
              <Marker position={r.destination} icon={markerIcon}>
                <Popup>{r.callsign || "DEST"}</Popup>
              </Marker>
              <Polyline positions={[r.departure, r.destination]} pathOptions={{ color: r.color, weight: 4 }} />
              <Marker position={planePosition as [number, number]} icon={planeIcon}>
                <Popup>{r.callsign || "Vol"}</Popup>
              </Marker>
            </Fragment>
          );
        })}
        {allPoints.length ? <FitBounds points={allPoints} /> : null}
      </MapContainer>
      {!validRoutes.length ? (
        <div className="rounded-b bg-zinc-100 dark:bg-zinc-800 p-3 text-zinc-700 dark:text-zinc-200">
          Carte mondiale affichée, mais aucun vol traçable (coordonnées inconnues).
        </div>
      ) : null}
    </div>
  );
}
