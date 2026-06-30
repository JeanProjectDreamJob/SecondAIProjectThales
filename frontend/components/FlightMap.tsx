"use client";

import { Fragment, useEffect, useMemo, useState, useRef } from "react";
import { MapContainer, TileLayer, Marker, Polyline, Popup, Tooltip, useMap, CircleMarker, GeoJSON, Circle } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const AIRPORT_COORDS: Record<string, [number, number]> = {
  // Airports
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
  EKCH: [55.6180, 12.6560],
  ESSA: [59.6519, 17.9186],
  ENGM: [60.1976, 11.1004],
  LGAV: [37.9364, 23.9445],
  EIDW: [53.4213, -6.2700],
  LPPT: [38.7813, -9.1359],
  // Additional European airports for MTCD scenarios
  LHBP: [47.4298, 19.2611],  // Budapest
  EPWA: [52.1657, 20.9671],  // Warsaw
  LKPR: [50.1008, 14.2600],  // Prague
  LIMC: [45.6306, 8.7231],   // Milan Malpensa
  EDDM: [48.3538, 11.7861],  // Munich
  EDDF: [50.0379, 8.5622],   // Frankfurt
  EDDL: [51.2895, 6.7668],   // Düsseldorf
  EDDH: [53.6304, 9.9882],   // Hamburg
  LEBL: [41.2971, 2.0785],   // Barcelona
  LFBO: [43.6293, 1.3638],   // Toulouse
  LEBB: [43.3011, -2.9106],  // Bilbao
  LEMG: [36.6749, -4.4991],  // Malaga
  LEZL: [37.4180, -5.8931],  // Seville
  LIRN: [40.8860, 14.2908],  // Naples
  LIMJ: [44.4133, 8.8375],   // Genoa
  LIPZ: [45.5053, 12.3519],  // Venice
  LBSF: [42.6967, 23.4114],  // Sofia
  LROP: [44.5711, 26.0850],  // Bucharest
  LZIB: [48.1702, 17.2127],  // Bratislava
  LYBE: [44.8184, 20.3091],  // Belgrade
  LDZA: [45.7429, 16.0688],  // Zagreb
  LJLJ: [46.2237, 14.4576],  // Ljubljana
  LOWS: [47.7933, 13.0043],  // Salzburg
  LOWI: [47.2602, 11.3436],  // Innsbruck
  LSZB: [46.9141, 7.4997],   // Bern
  KJFK: [40.6413, -73.7781],
  KLAX: [33.9425, -118.4081],
  KSFO: [37.6190, -122.3750],
  KORD: [41.9742, -87.9073],
  KMIA: [25.7959, -80.2870],
  KIAH: [29.9902, -95.3368],
  CYYZ: [43.6772, -79.6306],
  CYUL: [45.4706, -73.7408],
  RJTT: [35.5533, 139.7811],
  RKSS: [37.4602, 126.4407],
  VTBS: [13.6811, 100.7475],
  VIDP: [28.5665, 77.1031],
  VABB: [19.0896, 72.8656],
  YSSY: [-33.9461, 151.1772],
  YMML: [-37.6690, 144.8410],
  FAOR: [-26.1392, 28.2460],
  FACT: [-33.9648, 18.6017],
  // Asia / Middle East airports
  VOMM: [12.9941, 80.1709],   // Chennai
  VOBL: [13.1979, 77.7063],   // Bengaluru
  VOCI: [10.1520, 76.3919],   // Kochi
  VOHS: [17.2313, 78.4298],   // Hyderabad
  OPKC: [24.9065, 67.1608],   // Karachi
  OPIS: [33.6167, 73.0994],   // Islamabad
  OPLA: [31.5216, 74.4036],   // Lahore
  OMDB: [25.2532, 55.3657],   // Dubai
  OMAA: [24.4330, 54.6511],   // Abu Dhabi
  OTBD: [25.2732, 51.6081],   // Doha
  OERK: [24.9576, 46.6988],   // Riyadh
  OEJN: [21.6796, 39.1565],   // Jeddah
  WMKK: [ 2.7456,101.7099],   // Kuala Lumpur
  ZBAA: [40.0799,116.5843],   // Beijing
  ZSPD: [31.1434,121.8052],   // Shanghai
  ZUUU: [30.5785,103.9473],   // Chengdu
  // EUROCONTROL/ICAO waypoints
  PERON: [50.917,   1.750],
  KONAN: [50.217,   3.450],
  VESAN: [48.517,   4.033],
  OKMET: [45.000,   2.400],
  SOBIT: [43.617,   5.450],
  AMVAR: [43.000,   6.833],
  LORKU: [47.717,   7.567],
  NATOR: [46.833,   8.500],
  MILPA: [45.483,  11.600],
  ROTUN: [43.033,  11.017],
  LABAL: [41.500,  13.567],
  IRMAR: [37.733,  15.200],
  KANIG: [47.833,  16.667],
  GIVMI: [46.900,  19.050],
  RUDUS: [45.333,  20.167],
  PESAT: [43.833,  22.500],
  ADOSA: [41.267,  26.417],
  KOBAN: [41.033,  29.000],
  RIDSU: [38.000,  35.000],
  DESDI: [36.500,  36.833],
  MOGOL: [24.000,  45.000],
  DITOX: [20.000,  56.000],
  NIBDA: [20.000,  73.000],
  NILAK: [10.000,  80.000],
  PEXEG: [13.000,  77.000],
  KELOR: [ 5.000, 100.000],
  BIKTA: [ 1.500, 104.000],
  DOLIR: [55.000, -15.000],
  SOMAX: [54.000, -20.000],
  MIMKU: [53.000, -30.000],
  LASNO: [50.000, -40.000],
  RAFOX: [50.000, -55.000],
  PIKIL: [49.000, -50.000],
  SCROD: [46.000, -53.000],
  NARAK: [44.300,  -2.667],
  RESMI: [37.667,  -7.767],
  PEKLO: [40.000,  75.000],
  SADOL: [35.000,  90.000],
  SANKO: [30.000, 100.000],
  BETUL: [10.000,  20.000],
  NAVIX: [ 0.000,  35.000],
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

function interpolateMultiPoint(points: [number, number][], ratio: number): [number, number] {
  if (points.length === 0) return [0, 0];
  if (points.length === 1) return points[0];
  if (ratio <= 0) return points[0];
  if (ratio >= 1) return points[points.length - 1];

  const totalSegments = points.length - 1;
  const segmentDuration = 1 / totalSegments;
  const segmentIndex = Math.floor(ratio / segmentDuration);
  const segmentRatio = (ratio % segmentDuration) / segmentDuration;

  const start = points[segmentIndex];
  const end = points[segmentIndex + 1] || start;
  return interpolatePoint(start, end, segmentRatio);
}

function getBearing(start: [number, number], end: [number, number]): number {
  const toRad = (v: number) => (v * Math.PI) / 180;
  const lat1 = toRad(start[0]);
  const lat2 = toRad(end[0]);
  const dLon = toRad(end[1] - start[1]);
  const y = Math.sin(dLon) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
  return (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;
}

function getHeading(points: [number, number][], ratio: number): number {
  if (points.length < 2) return 0;
  if (ratio <= 0) return getBearing(points[0], points[1]);
  if (ratio >= 1) {
    const last = points.length - 1;
    return getBearing(points[last - 1], points[last]);
  }
  const totalSegments = points.length - 1;
  const segmentDuration = 1 / totalSegments;
  const segmentIndex = Math.floor(ratio / segmentDuration);
  const start = points[segmentIndex];
  const end = points[segmentIndex + 1] || start;
  return getBearing(start, end);
}

function getRouteDistanceKm(start: [number, number], end: [number, number]) {
  const toRad = (value: number) => (value * Math.PI) / 180;
  const [lat1] = start;
  const [lat2] = end;
  const earthRadiusKm = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(end[1] - start[1]);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadiusKm * c;
}

function getMultiRouteDistanceKm(points: [number, number][]) {
  let dist = 0;
  for (let i = 0; i < points.length - 1; i++) {
    dist += getRouteDistanceKm(points[i], points[i + 1]);
  }
  return dist;
}

function getCurrentAltitudeFt(progress: number, cruiseFt: number, totalKm: number): number {
  const climbKm = Math.min(120, totalKm * 0.15);
  const descentKm = Math.min(150, totalKm * 0.15);

  const climbRatio = climbKm / totalKm;
  const descentRatio = descentKm / totalKm;

  if (progress <= climbRatio) {
    return Math.round((progress / climbRatio) * cruiseFt);
  }
  if (progress >= 1 - descentRatio) {
    return Math.round(((1 - progress) / descentRatio) * cruiseFt);
  }
  return cruiseFt;
}


const WAYPOINT_COORDS: Record<string, [number, number]> = {
  TRESO:[48.867,2.167],MOLBA:[49.25,1.833],ETAMO:[47.283,5.867],RENAR:[48.083,7.367],
  DIKOL:[43.967,3.0],BORDI:[44.383,-0.117],LERGA:[43.117,-0.6],TOPTU:[46.633,0.267],
  RONNY:[49.5,3.033],ODINA:[47.167,2.167],LAMSO:[51.417,-1.083],TIMBA:[52.183,-0.767],
  WOTAN:[53.45,-2.583],DIKAS:[50.917,-1.667],MONTY:[55.6,-2.35],CLACT:[51.783,1.15],
  DOMUX:[48.317,9.933],ABGAS:[51.183,11.583],POVEL:[52.767,13.95],RISGA:[53.217,10.717],
  KERAX:[49.317,12.133],ROKIL:[51.583,7.45],REDGO:[50.133,8.083],INBED:[47.65,10.533],
  VIBAS:[43.167,-1.683],DELOG:[41.433,-3.85],BELEN:[38.867,-3.7],SUGOL:[42.633,-7.467],
  TOLVU:[40.383,-1.583],LUBET:[36.75,-4.35],ADEBA:[43.717,10.367],BOLIV:[44.5,11.333],
  NIXSO:[41.05,15.95],DEGVU:[44.117,8.433],SIVOM:[39.933,18.367],DITON:[47.017,6.583],
  VEBIT:[46.35,9.45],LATLO:[47.483,13.25],MASEX:[48.55,14.767],HELEN:[50.5,3.167],
  RUSIT:[52.083,5.083],DENUT:[51.717,3.167],NORKU:[57.767,10.067],PERAN:[56.067,14.733],
  REKNA:[58.033,11.55],ELPAS:[60.5,11.267],PESEK:[50.733,16.167],LOKVU:[48.4,18.317],
  BOGNA:[46.35,15.217],REKOX:[44.783,21.717],KELOM:[46.117,23.867],NIRVA:[38.233,20.717],
  SOSNA:[36.75,22.633],OVRIX:[36.333,32.617],PASIV:[40.467,-7.267],OBELO:[38.817,-8.95],
  LOBNA:[33.5,38.833],
  // Middle East / Gulf
  TEHRI:[35.5,51.5],IRNAK:[29.5,57.5],DUBWI:[25.2,55.4],MUSCO:[23.5,58.5],JEFDA:[21.7,39.2],
  // India
  KARNI:[28.5,77.5],DEVOS:[25.0,80.5],OPLOT:[21.5,72.5],NAKBU:[17.5,78.5],
  SULAM:[15.0,74.5],GANDU:[21.5,85.0],TALIP:[10.5,77.5],
  // Pakistan / Central Asia
  PAKSO:[30.0,70.0],ISLAB:[33.5,73.0],
  // Southeast Asia
  BANGO:[13.8,100.8],KULMP:[3.1,101.5],
  // China
  CHENG:[30.5,104.0],WUHAN:[30.6,114.1],BEIJK:[39.9,116.4],
};

function lookupCoord(name: string): [number, number] | undefined {
  return AIRPORT_COORDS[name] ?? WAYPOINT_COORDS[name];
}

interface PlanItem {
  departure?: string;
  destination?: string;
  callsign?: string;
  speed?: string | null;
  cruise_speed?: string | null;
  aircraft_type?: string | null;
  flight_level?: string | null;
  initial_accumulated_ms?: number;
  route?: string | null;
  runway?: string | null;
}

interface FlightMapProps {
  plans?: PlanItem[] | null;
  onWaypointInserted?: (planIdx: number, icao: string) => void;
  conflictPoint?: [number, number] | null;
}

interface RouteItem {
  id: string;
  callsign?: string;
  departureName?: string;
  destinationName?: string;
  departure: [number, number];
  destination: [number, number];
  color: string;
  speedKnots: number;
  routePoints: [number, number][];
  baseWaypoints: [number, number][];
  baseWaypointNames: string[];
  aircraft_type?: string;
  flight_level?: string;
  runway?: string;
  cruiseAltFt: number;
  totalKm: number;
  initialAccumulatedMs: number;
}

interface SuaZone {
  id: string;
  name: string;
  type: "P" | "R" | "D";
  lat: number;
  lon: number;
  radius_km: number;
  country: string;
  lower_fl: number;
  upper_fl: number;
}

function pointInRing(lon: number, lat: number, ring: number[][]): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i][0], yi = ring[i][1], xj = ring[j][0], yj = ring[j][1];
    if (((yi > lat) !== (yj > lat)) && lon < ((xj - xi) * (lat - yi)) / (yj - yi) + xi)
      inside = !inside;
  }
  return inside;
}

function pointInGeoJsonGeometry(lon: number, lat: number, geometry: GeoJSON.Geometry): boolean {
  const polygons: number[][][][] =
    geometry.type === "Polygon"
      ? [geometry.coordinates as number[][][]]
      : geometry.type === "MultiPolygon"
      ? (geometry.coordinates as number[][][][])
      : [];
  for (const poly of polygons) {
    if (!pointInRing(lon, lat, poly[0])) continue;
    let inHole = false;
    for (let h = 1; h < poly.length; h++) {
      if (pointInRing(lon, lat, poly[h])) { inHole = true; break; }
    }
    if (!inHole) return true;
  }
  return false;
}

function findFIR(latLng: [number, number], firData: GeoJSON.FeatureCollection): string | null {
  const [lat, lon] = latLng;
  for (const f of firData.features) {
    if (f.geometry && pointInGeoJsonGeometry(lon, lat, f.geometry))
      return (f.properties as Record<string, string>)?.id ?? null;
  }
  return null;
}

function pointToSegmentDist(p: [number, number], a: [number, number], b: [number, number]): number {
  const dx = b[0] - a[0], dy = b[1] - a[1];
  if (dx === 0 && dy === 0) return Math.hypot(p[0] - a[0], p[1] - a[1]);
  const t = Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / (dx * dx + dy * dy)));
  return Math.hypot(p[0] - a[0] - t * dx, p[1] - a[1] - t * dy);
}

function findNearestPoint(mouse: [number, number], airports: [number, number, string][], waypoints: [number, number, string][]): [number, number] {
  let minDist = Infinity;
  let nearest: [number, number] = mouse;
  for (const pt of airports) {
    const d = (pt[0] - mouse[0]) ** 2 + (pt[1] - mouse[1]) ** 2;
    if (d < minDist) { minDist = d; nearest = [pt[0], pt[1]]; }
  }
  for (const pt of waypoints) {
    const d = (pt[0] - mouse[0]) ** 2 + (pt[1] - mouse[1]) ** 2;
    if (d < minDist) { minDist = d; nearest = [pt[0], pt[1]]; }
  }
  return nearest;
}

function findInsertIdx(click: [number, number], points: [number, number][]): number {
  let min = Infinity, idx = 1;
  for (let i = 0; i < points.length - 1; i++) {
    const d = pointToSegmentDist(click, points[i], points[i + 1]);
    if (d < min) { min = d; idx = i + 1; }
  }
  return idx;
}

interface DragState { routeId: string; insertIdx: number; point: [number, number] }

function MapDragHandler({ isActive, onMove, onCommit }: {
  isActive: boolean;
  onMove: (pt: [number, number]) => void;
  onCommit: () => void;
}) {
  const map = useMap();
  const onMoveRef = useRef(onMove);
  const onCommitRef = useRef(onCommit);
  useEffect(() => { onMoveRef.current = onMove; }, [onMove]);
  useEffect(() => { onCommitRef.current = onCommit; }, [onCommit]);

  useEffect(() => {
    if (!isActive) return;
    map.dragging.disable();
    const handleMove = (e: L.LeafletMouseEvent) => onMoveRef.current([e.latlng.lat, e.latlng.lng]);
    const handleUp = () => { onCommitRef.current(); map.dragging.enable(); };
    map.on("mousemove", handleMove);
    // Use window so mouseup is caught even if an interactive overlay absorbs it
    window.addEventListener("mouseup", handleUp);
    return () => {
      map.off("mousemove", handleMove);
      window.removeEventListener("mouseup", handleUp);
      map.dragging.enable();
    };
  }, [isActive, map]);
  return null;
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

export default function FlightMap({ plans, onWaypointInserted, conflictPoint }: FlightMapProps) {
  const [progressByRoute, setProgressByRoute] = useState<Record<string, number>>({});
  const [speedMultiplierByRoute, setSpeedMultiplierByRoute] = useState<Record<string, number>>({});
  const [bgAirports, setBgAirports] = useState<[number, number, string][]>([]);
  const [bgWaypoints, setBgWaypoints] = useState<[number, number, string][]>([]);
  const [firData, setFirData] = useState<GeoJSON.FeatureCollection | null>(null);
  const coordToIcaoRef = useRef<Map<string, string>>(new Map());
  const [extraWaypointsByRoute, setExtraWaypointsByRoute] = useState<Record<string, [number, number][]>>({});
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [activeTabByRoute, setActiveTabByRoute] = useState<Record<string, number>>({});
  const [currentFirByRoute, setCurrentFirByRoute] = useState<Record<string, string>>({});
  const [mtcdPairs, setMtcdPairs] = useState<Set<string>>(new Set());
  const [suaZones, setSuaZones] = useState<SuaZone[]>([]);
  const [apwByRoute, setApwByRoute] = useState<Record<string, SuaZone[]>>({});
  const [labelCollapsed, setLabelCollapsed] = useState<Record<string, boolean>>({});
  const [labelPositions, setLabelPositions] = useState<Record<string, [number, number]>>({});
  const labelOffsetsRef = useRef<Record<string, [number, number]>>({});
  const isDraggingLabelRef = useRef<Record<string, boolean>>({});
  const [globalMultiplier, setGlobalMultiplier] = useState(1);
  const globalMultiplierRef = useRef(1);
  const progressRef = useRef<Record<string, number>>({});

  const speedMultiplierRef = useRef<Record<string, number>>({});
  const accumulatedByRoute = useRef<Record<string, number>>({});
  const extraWaypointsRef = useRef<Record<string, [number, number][]>>({});
  const dragStateRef = useRef<DragState | null>(null);

  useEffect(() => {
    const map = coordToIcaoRef.current;
    fetch("/fir-boundaries.geojson").then(r => r.json()).then(setFirData).catch(() => {});
    fetch("/sua-zones.json").then(r => r.json()).then(setSuaZones).catch(() => {});
    fetch("/airports.json").then(r => r.json()).then((data: [number, number, string][]) => {
      setBgAirports(data);
      data.forEach(([lat, lon, icao]) => map.set(`${lat},${lon}`, icao));
    }).catch(() => {});
    fetch("/waypoints.json").then(r => r.json()).then((data: [number, number, string][]) => {
      setBgWaypoints(data);
      data.forEach(([lat, lon, name]) => map.set(`${lat},${lon}`, name));
    }).catch(() => {});
  }, []);

  useEffect(() => { speedMultiplierRef.current = speedMultiplierByRoute; }, [speedMultiplierByRoute]);
  useEffect(() => { globalMultiplierRef.current = globalMultiplier; }, [globalMultiplier]);
  useEffect(() => { extraWaypointsRef.current = extraWaypointsByRoute; }, [extraWaypointsByRoute]);
  useEffect(() => { dragStateRef.current = dragState; }, [dragState]);

  const validRoutes = useMemo(() => {
    if (!plans) return [] as RouteItem[];
    return plans
      .map((p, idx) => {
        const d = p.departure ? AIRPORT_COORDS[p.departure] : undefined;
        const dest = p.destination ? AIRPORT_COORDS[p.destination] : undefined;
        if (!d || !dest) return null;

        const flVal = (p.flight_level || "FL350").toUpperCase();
        const cruiseAltFt = parseInt(flVal.replace("FL", ""), 10) * 100 || 35000;

        const routeTokens = (p.route || "").split(/\s+/).filter(s => s && s !== "DCT");
        const baseWaypoints: [number, number][] = routeTokens
          .map(name => lookupCoord(name))
          .filter(Boolean) as [number, number][];
        const routePoints: [number, number][] = [d, ...baseWaypoints, dest];
        const totalKm = getMultiRouteDistanceKm(routePoints);

        return {
          id: `${p.callsign || "plan"}-${idx}`,
          callsign: p.callsign,
          departureName: p.departure,
          destinationName: p.destination,
          departure: d,
          destination: dest,
          color: COLORS[idx % COLORS.length],
          speedKnots: parseSpeed(p),
          routePoints,
          baseWaypoints,
          baseWaypointNames: routeTokens,
          aircraft_type: p.aircraft_type || "B738",
          flight_level: flVal,
          runway: p.runway ?? undefined,
          cruiseAltFt,
          totalKm,
          initialAccumulatedMs: p.initial_accumulated_ms ?? 0,
        };
      })
      .filter(Boolean) as RouteItem[];
  }, [plans]);

  useEffect(() => {
    if (!validRoutes.length) {
      setProgressByRoute({});
      setLabelCollapsed({});
      setLabelPositions({});
      labelOffsetsRef.current = {};
      isDraggingLabelRef.current = {};
      accumulatedByRoute.current = {};
      return;
    }

    accumulatedByRoute.current = {};
    validRoutes.forEach(r => {
      accumulatedByRoute.current[r.id] = r.initialAccumulatedMs;
    });
    let frameId = 0;
    let lastTime = performance.now();

    const animate = (now: number) => {
      const deltaMs = now - lastTime;
      lastTime = now;

      setProgressByRoute((prev) => {
        const next = { ...prev };
        validRoutes.forEach((route) => {
          const multiplier = (speedMultiplierRef.current[route.id] ?? 1) * globalMultiplierRef.current;
          accumulatedByRoute.current[route.id] =
            (accumulatedByRoute.current[route.id] ?? 0) + deltaMs * multiplier;
          const extra = extraWaypointsRef.current[route.id] || [];
          const effectivePts: [number, number][] = [route.departure, ...route.baseWaypoints, ...extra, route.destination];
          const distanceKm = getMultiRouteDistanceKm(effectivePts);
          const durationMs = Math.max(15000, (distanceKm / (route.speedKnots * 1.852)) * 3600 * 1000);
          next[route.id] = (accumulatedByRoute.current[route.id] % durationMs) / durationMs;
        });
        progressRef.current = next;
        return next;
      });
      frameId = window.requestAnimationFrame(animate);
    };

    frameId = window.requestAnimationFrame(animate);
    return () => window.cancelAnimationFrame(frameId);
  }, [validRoutes]);

  useEffect(() => {
    if (!firData || !validRoutes.length) return;
    const check = () => {
      const firs: Record<string, string> = {};
      validRoutes.forEach((route) => {
        const progress = progressRef.current[route.id] ?? 0;
        const extra = extraWaypointsRef.current[route.id] || [];
        const pts: [number, number][] = [route.departure, ...route.baseWaypoints, ...extra, route.destination];
        const pos = interpolateMultiPoint(pts, progress);
        firs[route.id] = findFIR(pos, firData) ?? "—";
      });
      setCurrentFirByRoute(firs);
    };
    check();
    const id = window.setInterval(check, 2000);
    return () => window.clearInterval(id);
  }, [firData, validRoutes]);

  useEffect(() => {
    if (validRoutes.length < 2) { setMtcdPairs(new Set()); return; }
    const check = () => {
      const alerts = new Set<string>();
      for (let i = 0; i < validRoutes.length; i++) {
        for (let j = i + 1; j < validRoutes.length; j++) {
          const r1 = validRoutes[i], r2 = validRoutes[j];
          const p1 = progressRef.current[r1.id] ?? 0;
          const p2 = progressRef.current[r2.id] ?? 0;
          const e1 = extraWaypointsRef.current[r1.id] || [];
          const e2 = extraWaypointsRef.current[r2.id] || [];
          const pts1: [number, number][] = [r1.departure, ...r1.baseWaypoints, ...e1, r1.destination];
          const pts2: [number, number][] = [r2.departure, ...r2.baseWaypoints, ...e2, r2.destination];
          const pos1 = interpolateMultiPoint(pts1, p1);
          const pos2 = interpolateMultiPoint(pts2, p2);
          const distKm = getRouteDistanceKm(pos1, pos2);
          const alt1 = getCurrentAltitudeFt(p1, r1.cruiseAltFt, getMultiRouteDistanceKm(pts1));
          const alt2 = getCurrentAltitudeFt(p2, r2.cruiseAltFt, getMultiRouteDistanceKm(pts2));
          if (distKm < 9.26 && Math.abs(alt1 - alt2) < 1000) {
            alerts.add(r1.id);
            alerts.add(r2.id);
          }
        }
      }
      setMtcdPairs(alerts);
    };
    const id = window.setInterval(check, 500);
    return () => window.clearInterval(id);
  }, [validRoutes]);

  useEffect(() => {
    if (!suaZones.length || !validRoutes.length) { setApwByRoute({}); return; }
    const check = () => {
      const apw: Record<string, SuaZone[]> = {};
      validRoutes.forEach((route) => {
        const progress = progressRef.current[route.id] ?? 0;
        const extra = extraWaypointsRef.current[route.id] || [];
        const pts: [number, number][] = [route.departure, ...route.baseWaypoints, ...extra, route.destination];
        const pos = interpolateMultiPoint(pts, progress);
        const totalKm = getMultiRouteDistanceKm(pts);
        const currentAltFt = getCurrentAltitudeFt(progress, route.cruiseAltFt, totalKm);
        const currentAltFl = Math.round(currentAltFt / 100);
        const triggered: SuaZone[] = [];
        suaZones.forEach((zone) => {
          const distKm = getRouteDistanceKm(pos, [zone.lat, zone.lon]);
          if (distKm < zone.radius_km && currentAltFl >= zone.lower_fl && currentAltFl <= zone.upper_fl) {
            triggered.push(zone);
          }
        });
        if (triggered.length > 0) apw[route.id] = triggered;
      });
      setApwByRoute(apw);
    };
    check();
    const id = window.setInterval(check, 500);
    return () => window.clearInterval(id);
  }, [suaZones, validRoutes]);

  useEffect(() => {
    if (!validRoutes.length) return;
    const id = setInterval(() => {
      setLabelPositions(prev => {
        const next = { ...prev };
        validRoutes.forEach(r => {
          if (isDraggingLabelRef.current[r.id]) return;
          const progress = progressRef.current[r.id] ?? 0;
          const extra = extraWaypointsRef.current[r.id] || [];
          const pts: [number, number][] = [r.departure, ...r.baseWaypoints, ...extra, r.destination];
          const pos = interpolateMultiPoint(pts, progress);
          const offset = labelOffsetsRef.current[r.id] ?? [0.2, 0.5];
          next[r.id] = [pos[0] + offset[0], pos[1] + offset[1]];
        });
        return next;
      });
    }, 100);
    return () => clearInterval(id);
  }, [validRoutes]);

  const allPoints = useMemo(() => {
    const pts: [number, number][] = [];
    validRoutes.forEach((r) => {
      r.routePoints.forEach((pt) => pts.push(pt));
    });
    return pts;
  }, [validRoutes]);

  const center = useMemo(() => {
    if (allPoints.length === 0) return [20, 0] as [number, number];
    const lat = allPoints.reduce((s, p) => s + p[0], 0) / allPoints.length;
    const lon = allPoints.reduce((s, p) => s + p[1], 0) / allPoints.length;
    return [lat, lon] as [number, number];
  }, [allPoints]);

  function setRouteMultiplier(routeId: string, value: number) {
    setSpeedMultiplierByRoute((prev) => ({ ...prev, [routeId]: value }));
  }

  return (
    <div className="rounded overflow-hidden border border-zinc-200 dark:border-zinc-700 relative" style={{ minHeight: "24rem" }}>
      {validRoutes.length > 0 && (
        <div className="absolute top-3 right-3 z-[1000] flex flex-col gap-1.5">
          <div
            className="flex items-center gap-1 bg-zinc-800/90 rounded-full px-2 py-1 shadow-lg"
            style={{ backdropFilter: "blur(4px)" }}
          >
            <span className="font-mono text-[10px] font-bold w-14 text-zinc-300">ALL</span>
            <button
              onClick={() => setGlobalMultiplier((v) => Math.max(1, v === 10 ? 1 : v - 10))}
              disabled={globalMultiplier <= 1}
              className="w-6 h-6 rounded-full flex items-center justify-center text-white hover:bg-white/20 disabled:opacity-30 font-bold text-sm transition-all active:scale-90 cursor-pointer select-none"
            >
              −
            </button>
            <span className="text-zinc-200 font-mono text-[10px] w-7 text-center select-none">{globalMultiplier}x</span>
            <button
              onClick={() => setGlobalMultiplier((v) => Math.min(100, v === 1 ? 10 : v + 10))}
              disabled={globalMultiplier >= 100}
              className="w-6 h-6 rounded-full flex items-center justify-center text-white hover:bg-white/20 disabled:opacity-30 font-bold text-sm transition-all active:scale-90 cursor-pointer select-none"
            >
              +
            </button>
          </div>
          {validRoutes.map((r) => {
            const mult = speedMultiplierByRoute[r.id] ?? 1;
            return (
              <div
                key={r.id}
                className="flex items-center gap-1 bg-black/80 rounded-full px-2 py-1 shadow-lg"
                style={{ backdropFilter: "blur(4px)" }}
              >
                <span className="font-mono text-[10px] font-bold w-14 truncate" style={{ color: r.color }}>
                  {r.callsign || r.id}
                </span>
                <button
                  onClick={() => setRouteMultiplier(r.id, Math.max(1, mult - 10))}
                  disabled={mult <= 1}
                  className="w-6 h-6 rounded-full flex items-center justify-center text-white hover:bg-white/20 disabled:opacity-30 font-bold text-sm transition-all active:scale-90 cursor-pointer select-none"
                >
                  −
                </button>
                <span className="text-white font-mono text-[10px] w-7 text-center select-none">{mult}x</span>
                <button
                  onClick={() => setRouteMultiplier(r.id, Math.min(100, mult === 1 ? 10 : mult + 10))}
                  disabled={mult >= 100}
                  className="w-6 h-6 rounded-full flex items-center justify-center text-white hover:bg-white/20 disabled:opacity-30 font-bold text-sm transition-all active:scale-90 cursor-pointer select-none"
                >
                  +
                </button>
              </div>
            );
          })}
        </div>
      )}
      <MapContainer center={center} zoom={allPoints.length ? 3 : 2} scrollWheelZoom={true} style={{ height: "24rem", width: "100%" }}>
        <TileLayer
          attribution='Tiles &copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics, and the GIS User Community'
          url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
        />
        {firData && (
          <GeoJSON
            key="fir"
            data={firData}
            style={{ color: "#4ade80", weight: 1, fillOpacity: 0, opacity: 0.35, interactive: false } as L.PathOptions}
          />
        )}
        {conflictPoint && (
          <>
            <Circle
              center={conflictPoint}
              radius={9260}
              pathOptions={{ color: "#ef4444", fillColor: "#ef4444", fillOpacity: 0.08, weight: 1.5, dashArray: "6 4" }}
            />
            <CircleMarker
              center={conflictPoint}
              radius={5}
              pathOptions={{ color: "#ef4444", fillColor: "#ef4444", fillOpacity: 1, weight: 0 }}
            />
          </>
        )}
        {suaZones.map((zone) => {
          const color = zone.type === "P" ? "#ef4444" : zone.type === "R" ? "#f97316" : "#eab308";
          return (
            <Circle
              key={zone.id}
              center={[zone.lat, zone.lon]}
              radius={zone.radius_km * 1000}
              pathOptions={{
                color,
                fillColor: color,
                fillOpacity: 0.07,
                weight: 1,
                dashArray: zone.type === "P" ? undefined : "5 4",
                interactive: false,
              } as L.PathOptions}
            />
          );
        })}
        {bgAirports.map((pos, i) => (
          <CircleMarker key={`apt-${i}`} center={[pos[0], pos[1]]} radius={2} pathOptions={{ color: "#d4d4d4", fillColor: "#d4d4d4", fillOpacity: 0.7, weight: 0 }} />
        ))}
        {bgWaypoints.map((pos, i) => (
          <CircleMarker key={`wpt-${i}`} center={[pos[0], pos[1]]} radius={2} pathOptions={{ color: "#a3a3a3", fillColor: "#a3a3a3", fillOpacity: 0.9, weight: 0 }} />
        ))}
        {dragState && (
          <CircleMarker
            center={dragState.point}
            radius={5}
            pathOptions={{ color: "#facc15", fillColor: "#facc15", fillOpacity: 1, weight: 2 }}
          />
        )}
        <style>{`
          .leaflet-tooltip-right.atc-radar-label::before {
            border-right-color: rgba(9, 9, 11, 0.95) !important;
          }
          .leaflet-tooltip-left.atc-radar-label::before {
            border-left-color: rgba(9, 9, 11, 0.95) !important;
          }
          .leaflet-tooltip-top.atc-radar-label::before {
            border-top-color: rgba(9, 9, 11, 0.95) !important;
          }
          .leaflet-tooltip-bottom.atc-radar-label::before {
            border-bottom-color: rgba(9, 9, 11, 0.95) !important;
          }
          .atc-radar-label {
            border-left: 3px solid rgba(255,255,255,0.5) !important;
          }
          .atc-radar-label.mtcd-label {
            border-left: 3px solid #ef4444 !important;
          }
          .atc-radar-label.apw-label {
            border-left: 3px solid #f97316 !important;
          }
          @keyframes mtcd-pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.3; }
          }
          .mtcd-ring {
            animation: mtcd-pulse 0.8s ease-in-out infinite;
          }
          @keyframes apw-pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.25; }
          }
          .apw-ring {
            animation: apw-pulse 1.2s ease-in-out infinite;
          }
        `}</style>
        <MapDragHandler
          isActive={dragState !== null}
          onMove={(pt) => {
            const snapped = findNearestPoint(pt, bgAirports, bgWaypoints);
            setDragState(prev => prev ? { ...prev, point: snapped } : null);
          }}
          onCommit={() => {
            const ds = dragStateRef.current;
            if (!ds) return;
            const icao = coordToIcaoRef.current.get(`${ds.point[0]},${ds.point[1]}`) ?? "";
            setExtraWaypointsByRoute(prev => {
              const current = prev[ds.routeId] || [];
              const newWps = [...current.slice(0, ds.insertIdx - 1), ds.point, ...current.slice(ds.insertIdx - 1)];
              return { ...prev, [ds.routeId]: newWps };
            });
            if (icao && onWaypointInserted) {
              const planIdx = validRoutes.findIndex(r => r.id === ds.routeId);
              if (planIdx >= 0) onWaypointInserted(planIdx, icao);
            }
            setDragState(null);
          }}
        />
        {validRoutes.map((r) => {
          const isMtcd = mtcdPairs.has(r.id);
          const isApw = (apwByRoute[r.id]?.length ?? 0) > 0;
          const extra = extraWaypointsByRoute[r.id] || [];
          const effectivePoints: [number, number][] = [r.departure, ...r.baseWaypoints, ...extra, r.destination];
          const progress = progressByRoute[r.id] ?? 0;
          const planePosition = interpolateMultiPoint(effectivePoints, progress);
          const heading = getHeading(effectivePoints, progress);
          const headingDeg = Math.round(heading);

          const totalKm = getMultiRouteDistanceKm(effectivePoints);
          const currentAltFt = getCurrentAltitudeFt(progress, r.cruiseAltFt, totalKm);
          const phase = currentAltFt < r.cruiseAltFt * 0.98
            ? (progress < 0.5 ? "↑" : "↓")
            : "=";

          const planeIcon = L.divIcon({
            html: `<div style="transform: rotate(${heading}deg); width: 24px; height: 24px; display: flex; align-items: center; justify-content: center;">
              <svg width="22" height="22" viewBox="0 0 22 22" xmlns="http://www.w3.org/2000/svg">
                <path d="M11 1 L14 9 L11 8 L8 9 Z" fill="${r.color}" stroke="white" stroke-width="0.8"/>
                <path d="M11 9 L1 15 L11 13 L21 15 Z" fill="${r.color}" stroke="white" stroke-width="0.8"/>
                <path d="M11 16 L8 21 L11 20 L14 21 Z" fill="${r.color}" stroke="white" stroke-width="0.8"/>
              </svg>
            </div>`,
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
              {isMtcd && (
                <CircleMarker
                  center={planePosition as [number, number]}
                  radius={18}
                  className="mtcd-ring"
                  pathOptions={{ color: "#ef4444", fillOpacity: 0, weight: 2 }}
                />
              )}
              {isApw && (
                <CircleMarker
                  center={planePosition as [number, number]}
                  radius={isMtcd ? 26 : 18}
                  className="apw-ring"
                  pathOptions={{ color: "#f97316", fillOpacity: 0, weight: 2 }}
                />
              )}
              <Polyline
                positions={effectivePoints}
                pathOptions={{ color: isMtcd ? "#ef4444" : r.color, weight: isMtcd ? 3 : 4 }}
                eventHandlers={{
                  mousedown: (e) => {
                    L.DomEvent.stopPropagation(e.originalEvent);
                    const clickPt: [number, number] = [e.latlng.lat, e.latlng.lng];
                    const insertIdx = findInsertIdx(clickPt, effectivePoints);
                    setDragState({ routeId: r.id, insertIdx, point: clickPt });
                  }
                }}
              />
              {dragState?.routeId === r.id && (() => {
                const base = effectivePoints;
                const preview: [number, number][] = [
                  ...base.slice(0, dragState.insertIdx),
                  dragState.point,
                  ...base.slice(dragState.insertIdx),
                ];
                return <Polyline positions={preview} pathOptions={{ color: r.color, weight: 2, dashArray: "6 4", opacity: 0.7 }} />;
              })()}
              <Marker position={planePosition as [number, number]} icon={planeIcon} />
              {(() => {
                const labelPos: [number, number] = labelPositions[r.id] ?? [planePosition[0] + 0.2, planePosition[1] + 0.5];
                const isCollapsed = labelCollapsed[r.id] ?? true;
                const activeTab = activeTabByRoute[r.id] ?? 0;
                const routeIcaos: string[] = [
                  r.departureName || "DEP",
                  ...r.baseWaypointNames,
                  ...(extraWaypointsByRoute[r.id] || []).map(pt =>
                    coordToIcaoRef.current.get(`${pt[0]},${pt[1]}`) || "???"
                  ),
                  r.destinationName || "ARR",
                ];
                const labelAnchorIcon = L.divIcon({
                  html: `<div style="cursor:grab;width:6px;height:6px;background:${r.color};border:1px solid rgba(255,255,255,0.6);border-radius:1px;"></div>`,
                  className: "",
                  iconSize: [6, 6],
                  iconAnchor: [3, 3],
                });
                return (
                  <>
                    <Polyline
                      positions={[planePosition as [number, number], labelPos]}
                      pathOptions={{ color: r.color, weight: 1, opacity: 0.4, dashArray: "3 3", interactive: false } as L.PathOptions}
                    />
                    <Marker
                      position={labelPos}
                      draggable={true}
                      icon={labelAnchorIcon}
                      eventHandlers={{
                        dragstart: () => { isDraggingLabelRef.current[r.id] = true; },
                        dragend: (e: any) => {
                          isDraggingLabelRef.current[r.id] = false;
                          const newPos = (e.target as L.Marker).getLatLng();
                          const prog = progressRef.current[r.id] ?? 0;
                          const ex = extraWaypointsRef.current[r.id] || [];
                          const pts: [number, number][] = [r.departure, ...r.baseWaypoints, ...ex, r.destination];
                          const planePos = interpolateMultiPoint(pts, prog);
                          labelOffsetsRef.current[r.id] = [newPos.lat - planePos[0], newPos.lng - planePos[1]];
                          setLabelPositions(prev => ({ ...prev, [r.id]: [newPos.lat, newPos.lng] }));
                        },
                      }}
                    >
                      <Tooltip
                        permanent
                        interactive
                        direction="right"
                        offset={[10, 0]}
                        className={`atc-radar-label${isMtcd ? " mtcd-label" : isApw ? " apw-label" : ""} !bg-zinc-950/95 !border-white/40 !text-white !font-mono !text-[10px] !rounded !shadow-2xl border-l-4 !opacity-100 ${isCollapsed ? "!p-1.5" : "!p-2.5"}`}
                      >
                        {isCollapsed ? (
                          <div className="flex items-center gap-1.5 leading-none" style={{ minWidth: 70 }}>
                            <span className="font-bold text-[10px]" style={{ color: r.color }}>{r.callsign || r.id}</span>
                            {isMtcd && <span className="text-red-400 text-[9px] font-bold">⚠M</span>}
                            {isApw && <span className="text-orange-400 text-[9px] font-bold">⚠A</span>}
                            <button
                              onClick={() => setLabelCollapsed(prev => ({ ...prev, [r.id]: false }))}
                              className="text-white/50 hover:text-white text-[9px] ml-auto cursor-pointer select-none pl-1"
                            >▼</button>
                          </div>
                        ) : (
                          <div className="flex flex-col gap-0.5 leading-none" style={{ minWidth: 120 }}>
                            <div className="flex items-center justify-between gap-2 border-b border-white/20 pb-0.5 mb-0.5">
                              <span className="font-bold text-white">{r.callsign || "A1001"}</span>
                              <div className="flex gap-0.5 items-center">
                                {["INFO", "RTE"].map((tabLabel, i) => (
                                  <button
                                    key={tabLabel}
                                    onClick={() => setActiveTabByRoute(prev => ({ ...prev, [r.id]: i }))}
                                    className={`px-1 py-0 rounded text-[8px] font-bold transition-colors cursor-pointer ${activeTab === i ? "bg-white text-black" : "text-white/50 hover:text-white"}`}
                                  >
                                    {tabLabel}
                                  </button>
                                ))}
                                <button
                                  onClick={() => setLabelCollapsed(prev => ({ ...prev, [r.id]: true }))}
                                  className="text-white/50 hover:text-white text-[9px] ml-1 cursor-pointer select-none"
                                >▲</button>
                              </div>
                            </div>
                            {activeTab === 0 && (
                              <>
                                {isMtcd && (
                                  <div className="text-red-400 font-bold text-[9px] text-center tracking-widest border border-red-500/50 rounded px-1 py-0.5 mb-0.5">
                                    ⚠ MTCD
                                  </div>
                                )}
                                {isApw && (
                                  <div className="text-orange-400 font-bold text-[9px] text-center border border-orange-500/50 rounded px-1 py-0.5 mb-0.5">
                                    ⚠ APW: {apwByRoute[r.id].map(z => z.id).join(" / ")}
                                  </div>
                                )}
                                <div className="flex justify-between gap-4">
                                  <span>AC: {r.aircraft_type || "B738"}</span>
                                  <span>HDG: {headingDeg.toString().padStart(3, "0")}°</span>
                                </div>
                                <div className="flex justify-between gap-4">
                                  <span>ALT: <span className={phase === "=" ? "text-white" : "text-yellow-300"}>FL{Math.round(currentAltFt / 100).toString().padStart(3, "0")}</span></span>
                                  <span className={`font-bold ${phase === "=" ? "text-white/50" : "text-yellow-300"}`}>{phase}</span>
                                </div>
                                <div className="flex justify-between gap-4">
                                  <span className="text-white/60">CFL: {r.flight_level}</span>
                                </div>
                                <div className="flex justify-between gap-4">
                                  <span>GS: {r.speedKnots} kt</span>
                                </div>
                              </>
                            )}
                            {activeTab === 1 && (
                              <div className="flex flex-col gap-0.5 mt-0.5">
                                {routeIcaos.map((icao, i) => (
                                  <div key={i} className="flex flex-col items-start">
                                    <span className={i === 0 || i === routeIcaos.length - 1 ? "text-white font-bold" : "text-cyan-300"}>
                                      {i === 0 ? "DEP " : i === routeIcaos.length - 1 ? "ARR " : "    "}{icao}
                                    </span>
                                    {i === 0 && r.runway && (
                                      <span className="text-yellow-300 text-[8px] pl-4 font-bold tracking-wider">
                                        RWY {r.runway}
                                      </span>
                                    )}
                                    {i < routeIcaos.length - 1 && (
                                      <span className="text-white/30 text-[8px] pl-4">↓</span>
                                    )}
                                  </div>
                                ))}
                                <div className="border-t border-white/15 mt-1 pt-1">
                                  <span className="text-white/40 text-[8px]">FIR </span>
                                  <span className="text-green-400 font-bold">{currentFirByRoute[r.id] ?? "—"}</span>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </Tooltip>
                    </Marker>
                  </>
                );
              })()}
            </Fragment>
          );
        })}
        {allPoints.length ? <FitBounds points={allPoints} /> : null}
      </MapContainer>
      {!validRoutes.length ? (
        <div className="rounded-b bg-zinc-100 dark:bg-zinc-800 p-3 text-zinc-700 dark:text-zinc-200">
          World map displayed, but no plottable flight (unknown coordinates).
        </div>
      ) : null}
    </div>
  );
}
