"use client";

import { Fragment, useMemo } from "react";
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

interface PlanItem {
  departure?: string;
  destination?: string;
  callsign?: string;
}

interface FlightMapProps {
  plans?: PlanItem[] | null;
}

function FitBounds({ points }: { points: [number, number][] }) {
  const map = useMap();
  if (!points || points.length === 0) return null;
  const bounds = L.latLngBounds(points as any);
  map.fitBounds(bounds, { padding: [40, 40] });
  return null;
}

const COLORS = ["#00d2ff", "#ff7a00", "#8b5cf6", "#10b981"];

export default function FlightMap({ plans }: FlightMapProps) {
  const validRoutes = useMemo(() => {
    if (!plans) return [] as Array<{ callsign?: string; departure: [number, number]; destination: [number, number]; color: string }>;
    return plans
      .map((p, idx) => {
        const d = p.departure ? AIRPORT_COORDS[p.departure] : undefined;
        const dest = p.destination ? AIRPORT_COORDS[p.destination] : undefined;
        if (!d || !dest) return null;
        return { callsign: p.callsign, departure: d, destination: dest, color: COLORS[idx % COLORS.length] };
      })
      .filter(Boolean) as Array<{ callsign?: string; departure: [number, number]; destination: [number, number]; color: string }>;
  }, [plans]);

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
        {validRoutes.map((r) => (
          <Fragment key={r.callsign || `${r.departure.join("-")}-${r.destination.join("-")}`}>
            <Marker key={`${r.callsign}-dep`} position={r.departure} icon={markerIcon}>
              <Popup>{r.callsign || "DEP"}</Popup>
            </Marker>
            <Marker key={`${r.callsign}-dest`} position={r.destination} icon={markerIcon}>
              <Popup>{r.callsign || "DEST"}</Popup>
            </Marker>
            <Polyline key={`${r.callsign}-line`} positions={[r.departure, r.destination]} pathOptions={{ color: r.color, weight: 4 }} />
          </Fragment>
        ))}
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
