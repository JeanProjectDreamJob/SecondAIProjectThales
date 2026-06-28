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
  const departure = AIRPORT_COORDS[departureIcao] || [0, 0];
  const destination = AIRPORT_COORDS[destinationIcao] || [0, 0];
  const route = useMemo(() => [departure, destination], [departure, destination]);
  const center = useMemo(
    () => [
      (departure[0] + destination[0]) / 2,
      (departure[1] + destination[1]) / 2,
    ] as [number, number],
    [departure, destination]
  );

  const validRoute = departureIcao in AIRPORT_COORDS && destinationIcao in AIRPORT_COORDS;

  if (!validRoute) {
    return (
      <div className="rounded bg-zinc-100 dark:bg-zinc-800 p-4 text-zinc-700 dark:text-zinc-200">
        Impossible d’afficher la carte : codes ICAO inconnus ou pas de coordonnées disponibles.
      </div>
    );
  }

  return (
    <div className="rounded overflow-hidden border border-zinc-200 dark:border-zinc-700">
      <MapContainer
        center={center}
        zoom={5}
        scrollWheelZoom={false}
        className="h-96 w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={departure} icon={markerIcon}>
          <Popup>{departureIcao}</Popup>
        </Marker>
        <Marker position={destination} icon={markerIcon}>
          <Popup>{destinationIcao}</Popup>
        </Marker>
        <Polyline positions={route} pathOptions={{ color: "#2563eb", weight: 4 }} />
      </MapContainer>
    </div>
  );
}
