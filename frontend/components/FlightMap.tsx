"use client";

import { useMemo } from "react";
import { MapContainer, TileLayer, Marker, Polyline, Popup } from "react-leaflet";
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

interface FlightMapProps {
  departureIcao: string;
  destinationIcao: string;
}

export default function FlightMap({ departureIcao, destinationIcao }: FlightMapProps) {
  const departure = AIRPORT_COORDS[departureIcao];
  const destination = AIRPORT_COORDS[destinationIcao];
  const hasRoute = Boolean(departure && destination);
  const route = useMemo(() => (hasRoute ? [departure!, destination!] : []), [departure, destination, hasRoute]);
  const center = useMemo(() => {
    if (hasRoute) {
      return [
        ((departure![0] + destination![0]) / 2) as number,
        ((departure![1] + destination![1]) / 2) as number,
      ] as [number, number];
    }
    return [20, 0] as [number, number];
  }, [departure, destination, hasRoute]);

  return (
    <div className="rounded overflow-hidden border border-zinc-200 dark:border-zinc-700" style={{ minHeight: "24rem" }}>
      <MapContainer
        center={center}
        zoom={hasRoute ? 5 : 2}
        scrollWheelZoom={true}
        style={{ height: "24rem", width: "100%" }}
      >
        <TileLayer
          attribution='Tiles &copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics, and the GIS User Community'
          url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
        />
        {hasRoute ? (
          <>
            <Marker position={departure!} icon={markerIcon}>
              <Popup>{departureIcao}</Popup>
            </Marker>
            <Marker position={destination!} icon={markerIcon}>
              <Popup>{destinationIcao}</Popup>
            </Marker>
            <Polyline positions={route} pathOptions={{ color: "#00d2ff", weight: 4 }} />
          </>
        ) : null}
      </MapContainer>
      {!hasRoute ? (
        <div className="rounded-b bg-zinc-100 dark:bg-zinc-800 p-3 text-zinc-700 dark:text-zinc-200">
          Carte mondiale affichée, mais le vol ne peut pas être tracé car les coordonnées de l’aéroport sont inconnues.
        </div>
      ) : null}
    </div>
  );
}
