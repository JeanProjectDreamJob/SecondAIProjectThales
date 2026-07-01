"use client";

import { Suspense, useRef, useMemo, useState, useEffect, useCallback } from "react";
import { Canvas, useFrame, useLoader, useThree } from "@react-three/fiber";
import { OrbitControls, Stars, Html } from "@react-three/drei";
import * as THREE from "three";

// ── COORDS ──────────────────────────────────────────────────────────────────
const APT: Record<string, [number, number]> = {
  LOWW:[48.1103,16.5697],LFPG:[49.0097,2.5479],WSSS:[1.3644,103.9915],
  EGLL:[51.47,-0.4543],EDDT:[52.5597,13.2877],LIRF:[41.8003,12.2389],
  LEMD:[40.4722,-3.5608],EHAM:[52.3105,4.7683],EBBR:[50.9014,4.4844],
  LSZH:[47.4647,8.5492],LSGG:[46.2381,6.1089],LFML:[43.4367,5.2158],
  LFLL:[45.7256,5.0811],LFMN:[43.6584,7.2159],EKCH:[55.618,12.656],
  ESSA:[59.6519,17.9186],ENGM:[60.1976,11.1004],LGAV:[37.9364,23.9445],
  EIDW:[53.4213,-6.27],LPPT:[38.7813,-9.1359],LHBP:[47.4298,19.2611],
  EPWA:[52.1657,20.9671],LKPR:[50.1008,14.26],LIMC:[45.6306,8.7231],
  EDDM:[48.3538,11.7861],EDDF:[50.0379,8.5622],EDDL:[51.2895,6.7668],
  EDDH:[53.6304,9.9882],LEBL:[41.2971,2.0785],LFBO:[43.6293,1.3638],
  LEBB:[43.3011,-2.9106],LEMG:[36.6749,-4.4991],LEZL:[37.418,-5.8931],
  LIRN:[40.886,14.2908],LIMJ:[44.4133,8.8375],LIPZ:[45.5053,12.3519],
  LBSF:[42.6967,23.4114],LROP:[44.5711,26.085],LZIB:[48.1702,17.2127],
  LYBE:[44.8184,20.3091],LDZA:[45.7429,16.0688],LJLJ:[46.2237,14.4576],
  KJFK:[40.6413,-73.7781],KLAX:[33.9425,-118.4081],KSFO:[37.619,-122.375],
  KORD:[41.9742,-87.9073],KMIA:[25.7959,-80.287],KIAH:[29.9902,-95.3368],
  CYYZ:[43.6772,-79.6306],CYUL:[45.4706,-73.7408],RJTT:[35.5533,139.7811],
  RKSS:[37.4602,126.4407],VTBS:[13.6811,100.7475],VIDP:[28.5665,77.1031],
  VABB:[19.0896,72.8656],YSSY:[-33.9461,151.1772],YMML:[-37.669,144.841],
  FAOR:[-26.1392,28.246],FACT:[-33.9648,18.6017],VOMM:[12.9941,80.1709],
  VOBL:[13.1979,77.7063],VOCI:[10.152,76.3919],VOHS:[17.2313,78.4298],
  OPKC:[24.9065,67.1608],OPIS:[33.6167,73.0994],OPLA:[31.5216,74.4036],
  OMDB:[25.2532,55.3657],OMAA:[24.433,54.6511],OTBD:[25.2732,51.6081],
  OERK:[24.9576,46.6988],OEJN:[21.6796,39.1565],WMKK:[2.7456,101.7099],
  ZBAA:[40.0799,116.5843],ZSPD:[31.1434,121.8052],ZUUU:[30.5785,103.9473],
};

const WP: Record<string, [number, number]> = {
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
  LOBNA:[33.5,38.833],TEHRI:[35.5,51.5],IRNAK:[29.5,57.5],DUBWI:[25.2,55.4],
  MUSCO:[23.5,58.5],JEFDA:[21.7,39.2],KARNI:[28.5,77.5],DEVOS:[25.0,80.5],
  OPLOT:[21.5,72.5],NAKBU:[17.5,78.5],SULAM:[15.0,74.5],GANDU:[21.5,85.0],
  TALIP:[10.5,77.5],PAKSO:[30.0,70.0],ISLAB:[33.5,73.0],BANGO:[13.8,100.8],
  KULMP:[3.1,101.5],CHENG:[30.5,104.0],WUHAN:[30.6,114.1],BEIJK:[39.9,116.4],
  PERON:[50.917,1.75],KONAN:[50.217,3.45],VESAN:[48.517,4.033],OKMET:[45.0,2.4],
  SOBIT:[43.617,5.45],AMVAR:[43.0,6.833],LORKU:[47.717,7.567],NATOR:[46.833,8.5],
  MILPA:[45.483,11.6],DOMOK:[44.967,13.0],KOTOR:[44.983,13.483],RESMI:[47.967,15.633],
};

let _extraCoordsLookup: Record<string,[number,number]> = {};
function lookupCoord(name: string): [number, number] | undefined {
  return _extraCoordsLookup[name] ?? APT[name] ?? WP[name];
}

// ── I18N / CONSTANTS ─────────────────────────────────────────────────────────
const SPEED_PANEL_I18N: Record<string, { panel: string; all: string }> = {
  en: { panel: "Accelerate flight plan", all: "ALL" },
  fr: { panel: "Accélérer le plan de vol", all: "TOUS" },
  ro: { panel: "Accelerați planul de zbor", all: "TOATE" },
  zh: { panel: "加速飞行计划", all: "全部" },
  kn: { panel: "ಹಾರಾಟ ಯೋಜನೆ ವೇಗಗೊಳಿಸಿ", all: "ಎಲ್ಲಾ" },
};

type GlobeStyle = "satellite" | "map" | "dark";

const GLOBE_STYLES: Record<GlobeStyle, { texture: string | null; label: string; swatch: string }> = {
  satellite: { texture: "/earth-texture.jpg", label: "Satellite", swatch: "linear-gradient(135deg,#1a3a6b,#2a6ab5)" },
  map:       { texture: "/earth-map.jpg",     label: "Map",       swatch: "linear-gradient(135deg,#2d6a4f,#74c69d)" },
  dark:      { texture: null,                 label: "Dark",      swatch: "#050810" },
};

const ROUTE_COLORS = ["#00d2ff","#ff7a00","#8b5cf6","#10b981","#ef4444","#06b6d4","#f97316"];

// ── TYPES ────────────────────────────────────────────────────────────────────
interface PlanItem {
  departure?: string; destination?: string; callsign?: string;
  speed?: string | null; cruise_speed?: string | null;
  aircraft_type?: string | null; flight_level?: string | null;
  route?: string | null; runway?: string | null;
}

interface RouteData {
  id: string; planIdx: number; callsign: string;
  departureName: string; destinationName: string;
  depCoords: [number,number]; destCoords: [number,number];
  waypointCoords: [number,number][]; waypointNames: string[];
  color: string; cruiseAltFt: number; speedKnots: number;
  totalKm: number; aircraft_type: string; flight_level: string; runway?: string;
}

interface SuaZone {
  id: string; name: string; type: "P"|"R"|"D";
  lat: number; lon: number; radius_km: number;
  country: string; lower_fl: number; upper_fl: number;
}

interface DragInfo {
  routeId: string; planIdx: number; insertIdx: number;
  allPts: [number,number][];
}

interface PreviewSnap { latLon: [number,number]; icao: string }

// ── MATH ─────────────────────────────────────────────────────────────────────
function latLonToVec3(lat: number, lon: number, r = 1): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);
  return new THREE.Vector3(
    -r * Math.sin(phi) * Math.cos(theta),
    r * Math.cos(phi),
    r * Math.sin(phi) * Math.sin(theta)
  );
}

function vec3ToLatLon(v: THREE.Vector3): [number,number] {
  const n = v.clone().normalize();
  const phi = Math.acos(Math.max(-1, Math.min(1, n.y)));
  const theta = Math.atan2(n.z, -n.x);
  return [90 - phi * (180 / Math.PI), theta * (180 / Math.PI) - 180];
}

// Aviation altitude profile constants (for track label display)
const CLIMB_RATIO   = 0.10;
const DESCENT_RATIO = 0.12;
// Visual arc constants (wider + S-curve so the aircraft climbs while moving forward)
const MAX_VISUAL_H  = 0.09; // max arc height above sphere at cruise

// S-curve (half-cosine): derivative = 0 at departure/arrival so the aircraft
// starts moving horizontally before curving upward — no "vertical takeoff" effect.
function arcAltRatio(progress: number): number {
  const vc = 0.42; // visual climb spans first 42% of route
  const vd = 0.42; // visual descent spans last 42% of route
  if (progress < vc)      return 0.5 - 0.5 * Math.cos(Math.PI * progress / vc);
  if (progress > 1 - vd)  return 0.5 - 0.5 * Math.cos(Math.PI * (1 - progress) / vd);
  return 1.0;
}

// Single altitude profile over the whole route:
// - climb at start, cruise in middle, descent at end
// - waypoints stay at cruise altitude (no sine dip at each waypoint)
function buildArc(from: [number,number], to: [number,number], wps: [number,number][] = [], seg = 80): THREE.Vector3[] {
  const stops: [number,number][] = [from, ...wps, to];
  // Collect flat (unit-sphere) points for all segments
  const flat: THREE.Vector3[] = [];
  for (let s = 0; s < stops.length - 1; s++) {
    const a = latLonToVec3(stops[s][0], stops[s][1]);
    const b = latLonToVec3(stops[s+1][0], stops[s+1][1]);
    for (let i = (s === 0 ? 0 : 1); i <= seg; i++) {
      flat.push(new THREE.Vector3().lerpVectors(a, b, i / seg).normalize());
    }
  }
  // Apply single altitude profile spanning the whole route
  const n = flat.length;
  return flat.map((v, i) => v.clone().multiplyScalar(1 + arcAltRatio(i / Math.max(1, n - 1)) * MAX_VISUAL_H));
}

function haversineKm([lat1,lon1]: [number,number], [lat2,lon2]: [number,number]): number {
  const R = 6371, r = Math.PI / 180;
  const dLat = (lat2-lat1)*r, dLon = (lon2-lon1)*r;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*r)*Math.cos(lat2*r)*Math.sin(dLon/2)**2;
  return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

function getMultiDistKm(pts: [number,number][]): number {
  let d = 0;
  for (let i = 0; i < pts.length-1; i++) d += haversineKm(pts[i], pts[i+1]);
  return d;
}

function getCurrentAltFt(progress: number, cruiseFt: number): number {
  if (progress <= CLIMB_RATIO)         return Math.round((progress / CLIMB_RATIO) * cruiseFt);
  if (progress >= 1 - DESCENT_RATIO)  return Math.round(((1 - progress) / DESCENT_RATIO) * cruiseFt);
  return cruiseFt;
}

function parseSpeed(p: PlanItem): number {
  const m = (p.cruise_speed ?? p.speed ?? "").match(/\d+/);
  return m ? parseInt(m[0]) : 450;
}

function parseFL(p: PlanItem): number {
  return (parseInt((p.flight_level || "FL350").toUpperCase().replace("FL","")) || 350) * 100;
}

function ringPts(coords: number[][], r = 1.001): THREE.Vector3[] {
  return coords.map(([lon, lat]) => latLonToVec3(lat, lon, r));
}

function findInsertIdx3D(clickLL: [number,number], pts: [number,number][]): number {
  let min = Infinity, idx = 1;
  for (let i = 0; i < pts.length-1; i++) {
    const mid: [number,number] = [(pts[i][0]+pts[i+1][0])/2, (pts[i][1]+pts[i+1][1])/2];
    const d = haversineKm(clickLL, mid);
    if (d < min) { min = d; idx = i+1; }
  }
  return idx;
}

// ── EARTH ────────────────────────────────────────────────────────────────────
function EarthTextured({ tex }: { tex: string }) {
  const t = useLoader(THREE.TextureLoader, tex);
  return (
    <mesh>
      <sphereGeometry args={[1, 64, 64]} />
      <meshStandardMaterial map={t} roughness={0.6} metalness={0} />
    </mesh>
  );
}

function Earth({ style }: { style: GlobeStyle }) {
  const tex = GLOBE_STYLES[style].texture;
  return (
    <>
      <Suspense fallback={<mesh><sphereGeometry args={[1,64,64]}/><meshStandardMaterial color="#1a3a6b" roughness={0.8}/></mesh>}>
        {tex
          ? <EarthTextured tex={tex} />
          : <mesh><sphereGeometry args={[1,64,64]}/><meshStandardMaterial color="#050810" roughness={0.9} metalness={0.05}/></mesh>
        }
      </Suspense>
      <mesh><sphereGeometry args={[1.018,64,64]}/><meshBasicMaterial color="#4499ff" transparent opacity={0.045} side={THREE.FrontSide}/></mesh>
    </>
  );
}

// ── COUNTRY BORDERS ──────────────────────────────────────────────────────────
function CountryBorders() {
  const [lines, setLines] = useState<THREE.Line[]>([]);
  useEffect(() => {
    const mat = new THREE.LineBasicMaterial({ color: "#ffffff", transparent: true, opacity: 0.22 });
    fetch("/countries.geojson").then(r => r.json()).then((d: any) => {
      const out: THREE.Line[] = [];
      (d.features ?? []).forEach((f: any) => {
        if (!f.geometry) return;
        const rings: number[][][] =
          f.geometry.type === "Polygon" ? f.geometry.coordinates
          : f.geometry.type === "MultiPolygon" ? f.geometry.coordinates.flat()
          : [];
        rings.forEach(ring => {
          try {
            const pts = ringPts(ring, 1.001);
            if (pts.length < 2) return;
            out.push(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), mat));
          } catch {}
        });
      });
      setLines(out);
    }).catch(() => {});
  }, []);
  return <>{lines.map((l, i) => <primitive key={i} object={l} />)}</>;
}

// ── FIR BOUNDARIES ───────────────────────────────────────────────────────────
// Merged into a single LineSegments = 1 draw call (vs 1000+ individual Line objects)
const FIR_VERT = `
  varying vec3 vWorldNorm;
  void main() {
    vWorldNorm = normalize((modelMatrix * vec4(position, 1.0)).xyz);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;
const FIR_FRAG = `
  uniform vec3 uCamPos;
  varying vec3 vWorldNorm;
  void main() {
    if (dot(vWorldNorm, normalize(uCamPos)) < 0.0) discard;
    gl_FragColor = vec4(0.302, 0.871, 0.502, 0.85);
  }
`;

function FirBoundaries3D() {
  const matRef = useRef<THREE.ShaderMaterial | null>(null);
  const [obj, setObj] = useState<THREE.LineSegments | null>(null);

  useEffect(() => {
    fetch("/fir-boundaries.geojson").then(r => r.json()).then((d: any) => {
      const positions: number[] = [];
      (d.features ?? []).forEach((f: any) => {
        if (!f.geometry) return;
        const rings: number[][][] =
          f.geometry.type === "Polygon" ? f.geometry.coordinates
          : f.geometry.type === "MultiPolygon" ? f.geometry.coordinates.flat()
          : [];
        rings.forEach(ring => {
          try {
            if (ring.length < 2) return;
            for (let i = 0; i < ring.length - 1; i++) {
              const [lon1, lat1] = ring[i];
              const [lon2, lat2] = ring[i + 1];
              const a = latLonToVec3(lat1, lon1, 1.002);
              const b = latLonToVec3(lat2, lon2, 1.002);
              positions.push(a.x, a.y, a.z, b.x, b.y, b.z);
            }
          } catch {}
        });
      });
      const geo = new THREE.BufferGeometry();
      geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
      const mat = new THREE.ShaderMaterial({
        uniforms: { uCamPos: { value: new THREE.Vector3() } },
        vertexShader: FIR_VERT,
        fragmentShader: FIR_FRAG,
        transparent: true,
        depthWrite: false,
        depthTest: false,
      });
      matRef.current = mat;
      const ls = new THREE.LineSegments(geo, mat);
      ls.renderOrder = 5;
      setObj(ls);
    }).catch(() => {});
  }, []);

  useFrame(({ camera }) => {
    if (matRef.current) matRef.current.uniforms.uCamPos.value.copy(camera.position);
  });

  return obj ? <primitive object={obj} /> : null;
}

// ── SUA ZONES ─────────────────────────────────────────────────────────────────
// Draped on the globe surface (r=1.0015) — ring outline + filled geodesic cap
function SuaRing({ zone }: { zone: SuaZone }) {
  const objs = useMemo(() => {
    const color = zone.type === "P" ? "#ef4444" : zone.type === "R" ? "#f97316" : "#eab308";
    const R_GLOBE = 1.0015; // just above globe surface, below country borders (1.001)
    const R_EARTH = 6371;
    const ar = zone.radius_km / R_EARTH;
    const N = 72;
    const lat1 = zone.lat * Math.PI / 180;

    // Geodesic ring points
    const outer: THREE.Vector3[] = [];
    for (let i = 0; i <= N; i++) {
      const b = (i / N) * 2 * Math.PI;
      const lat2r = Math.asin(
        Math.sin(lat1) * Math.cos(ar) + Math.cos(lat1) * Math.sin(ar) * Math.cos(b)
      );
      const lon2 = zone.lon + Math.atan2(
        Math.sin(b) * Math.sin(ar) * Math.cos(lat1),
        Math.cos(ar) - Math.sin(lat1) * Math.sin(lat2r)
      ) * 180 / Math.PI;
      outer.push(latLonToVec3(lat2r * 180 / Math.PI, lon2, R_GLOBE));
    }

    // ── Filled geodesic cap: use two layers (DoubleSide + depthTest off to force visibility)
    const center = latLonToVec3(zone.lat, zone.lon, R_GLOBE);
    const positions: number[] = [center.x, center.y, center.z];
    outer.forEach(v => positions.push(v.x, v.y, v.z));

    const indices: number[] = [];
    for (let i = 0; i < N; i++) indices.push(0, i + 1, i + 2);

    const fillGeo = new THREE.BufferGeometry();
    fillGeo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    fillGeo.setIndex(indices);
    fillGeo.computeVertexNormals();

    const fillMat = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.22,
      side: THREE.DoubleSide,
      depthWrite: false,
      depthTest: false,
    });
    const fillMesh = new THREE.Mesh(fillGeo, fillMat);
    fillMesh.renderOrder = 1;

    // ── Ring outline at the boundary
    const ringGeo = new THREE.BufferGeometry().setFromPoints(outer);
    const ringMat = new THREE.LineBasicMaterial({ color, transparent: true, opacity: 1 });
    const ringLine = new THREE.Line(ringGeo, ringMat);
    ringLine.renderOrder = 2;

    return [fillMesh, ringLine];
  }, [zone]);

  return <>{objs.map((o, i) => <primitive key={i} object={o} />)}</>;
}

// ── BACKGROUND DOTS ───────────────────────────────────────────────────────────
function BackgroundDots({ data }: { data: [number,number][] }) {
  const pts = useMemo(() => {
    const pos = new Float32Array(data.length*3);
    data.forEach(([lat,lon],i) => {
      const v = latLonToVec3(lat, lon, 1.013);
      pos[i*3]=v.x; pos[i*3+1]=v.y; pos[i*3+2]=v.z;
    });
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(pos,3));
    return new THREE.Points(geo, new THREE.PointsMaterial({ color:"#b4b4c8", size:0.0045, transparent:true, opacity:0.65, sizeAttenuation:true }));
  }, [data]);
  return <primitive object={pts} />;
}

// ── DRAG CONTROLLER (inside Canvas) ──────────────────────────────────────────
function DragController({
  isDragging, bgPoints, onMove, onUp, orbitRef,
}: {
  isDragging: boolean;
  bgPoints: [number,number,string][];
  onMove: (snap: PreviewSnap | null) => void;
  onUp: () => void;
  orbitRef: React.RefObject<any>;
}) {
  const { camera, gl } = useThree();
  const onMoveRef = useRef(onMove);
  const onUpRef = useRef(onUp);
  useEffect(() => { onMoveRef.current = onMove; }, [onMove]);
  useEffect(() => { onUpRef.current = onUp; }, [onUp]);

  useEffect(() => {
    if (!isDragging) return;
    if (orbitRef.current) orbitRef.current.enabled = false;
    const el = gl.domElement;

    const handleMove = (e: PointerEvent) => {
      const rect = el.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      const ray = new THREE.Raycaster();
      ray.setFromCamera(new THREE.Vector2(x, y), camera);
      const hit = new THREE.Vector3();
      if (!ray.ray.intersectSphere(new THREE.Sphere(new THREE.Vector3(), 1.15), hit)) {
        onMoveRef.current(null); return;
      }
      const ll = vec3ToLatLon(hit);
      let minD = Infinity, best: [number,number,string] | null = null;
      for (const p of bgPoints) {
        const d = haversineKm([p[0],p[1]], ll);
        if (d < minD) { minD = d; best = p; }
      }
      if (best && minD < 300) onMoveRef.current({ latLon: [best[0], best[1]], icao: best[2] });
      else onMoveRef.current(null);
    };

    const handleUp = () => {
      onUpRef.current();
      if (orbitRef.current) orbitRef.current.enabled = true;
    };

    el.addEventListener("pointermove", handleMove);
    el.addEventListener("pointerup", handleUp);
    return () => {
      el.removeEventListener("pointermove", handleMove);
      el.removeEventListener("pointerup", handleUp);
      if (orbitRef.current) orbitRef.current.enabled = true;
    };
  }, [isDragging, bgPoints, camera, gl, orbitRef]);

  return null;
}

// ── TRACK LABEL ───────────────────────────────────────────────────────────────
function TrackLabel({ route, isMtcd, isApw, apwZones, altRef }: {
  route: RouteData; isMtcd: boolean; isApw: boolean; apwZones: SuaZone[];
  altRef: React.RefObject<HTMLSpanElement>;
}) {
  const [collapsed, setCollapsed] = useState(true);
  const [tab, setTab] = useState(0);
  const bc = isMtcd ? "#ef4444" : isApw ? "#f97316" : "rgba(255,255,255,0.25)";
  const bl = isMtcd ? "#ef4444" : isApw ? "#f97316" : "rgba(255,255,255,0.5)";
  return (
    <Html center style={{ pointerEvents:"auto", zIndex:10 }}>
      <div style={{
        background:"rgba(9,9,11,0.95)", backdropFilter:"blur(4px)",
        border:`1px solid ${bc}`, borderLeft:`3px solid ${bl}`, borderRadius:4,
        fontFamily:"monospace", fontSize:10, color:"#fff",
        boxShadow:"0 4px 20px rgba(0,0,0,0.8)", userSelect:"none", whiteSpace:"nowrap",
        padding: collapsed ? "4px 8px" : "8px 10px",
        minWidth: collapsed ? 70 : 145,
        transform:"translate(10px,-50%)",
      }}>
        {collapsed ? (
          <div style={{ display:"flex", alignItems:"center", gap:6 }}>
            <span style={{ color:route.color, fontWeight:700 }}>{route.callsign}</span>
            <span ref={altRef} style={{ color:"#67e8f9", fontSize:9 }}>FL000</span>
            {isMtcd && <span style={{ color:"#f87171", fontSize:9, fontWeight:700 }}>⚠M</span>}
            {isApw  && <span style={{ color:"#fb923c", fontSize:9, fontWeight:700 }}>⚠A</span>}
            <button onClick={()=>setCollapsed(false)} style={{ color:"rgba(255,255,255,0.4)", background:"none", border:"none", cursor:"pointer", marginLeft:"auto", fontSize:9 }}>▼</button>
          </div>
        ) : (
          <div style={{ display:"flex", flexDirection:"column", gap:3 }}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", borderBottom:"1px solid rgba(255,255,255,0.15)", paddingBottom:3, marginBottom:2 }}>
              <span style={{ fontWeight:700 }}>{route.callsign}</span>
              <div style={{ display:"flex", gap:2 }}>
                {["INFO","RTE"].map((l,i) => (
                  <button key={l} onClick={()=>setTab(i)} style={{
                    padding:"0 4px", borderRadius:2, fontSize:8, fontWeight:700, border:"none", cursor:"pointer",
                    background: tab===i ? "#fff" : "transparent", color: tab===i ? "#000" : "rgba(255,255,255,0.4)",
                  }}>{l}</button>
                ))}
                <button onClick={()=>setCollapsed(true)} style={{ color:"rgba(255,255,255,0.4)", background:"none", border:"none", cursor:"pointer", fontSize:9, marginLeft:2 }}>▲</button>
              </div>
            </div>
            {tab===0 && (
              <>
                {isMtcd && <div style={{ color:"#f87171", fontSize:9, fontWeight:700, textAlign:"center", border:"1px solid rgba(239,68,68,0.5)", borderRadius:2, padding:"2px 4px", marginBottom:2 }}>⚠ MTCD</div>}
                {isApw  && <div style={{ color:"#fb923c", fontSize:9, fontWeight:700, textAlign:"center", border:"1px solid rgba(249,115,22,0.5)", borderRadius:2, padding:"2px 4px", marginBottom:2 }}>⚠ APW: {apwZones.map(z=>z.id).join(" / ")}</div>}
                <div style={{ display:"flex", justifyContent:"space-between", gap:10 }}><span>AC: {route.aircraft_type}</span></div>
                <div style={{ display:"flex", justifyContent:"space-between", gap:10 }}>
                  <span>ALT: <span ref={altRef} style={{ color:"#67e8f9", fontWeight:700 }}>FL000</span></span>
                  <span style={{ color:"rgba(255,255,255,0.4)" }}>CFL: {route.flight_level}</span>
                </div>
                <div style={{ display:"flex", justifyContent:"space-between", gap:10 }}><span>GS: {route.speedKnots} kt</span></div>
                <div style={{ display:"flex", justifyContent:"space-between", gap:10 }}><span style={{ color:"rgba(255,255,255,0.5)" }}>{route.departureName} → {route.destinationName}</span></div>
              </>
            )}
            {tab===1 && (
              <div style={{ display:"flex", flexDirection:"column", gap:2, marginTop:2 }}>
                {[route.departureName, ...route.waypointNames, route.destinationName].map((icao,i,arr) => (
                  <div key={i}>
                    <span style={{ color: i===0||i===arr.length-1 ? "#fff":"#67e8f9", fontWeight: i===0||i===arr.length-1 ? 700:400 }}>
                      {i===0?"DEP ":i===arr.length-1?"ARR ":"    "}{icao}
                    </span>
                    {i===0 && route.runway && <div style={{ color:"#fde047", fontSize:8, paddingLeft:16, fontWeight:700 }}>RWY {route.runway}</div>}
                    {i<arr.length-1 && <div style={{ color:"rgba(255,255,255,0.2)", fontSize:8, paddingLeft:16 }}>↓</div>}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </Html>
  );
}

// ── AIRCRAFT PLANE SPRITE ─────────────────────────────────────────────────────
function shadeHex(hex: string, amt: number): string {
  const n = parseInt(hex.replace("#", ""), 16);
  const clamp = (v: number) => Math.min(255, Math.max(0, v));
  return `rgb(${clamp((n>>16)+amt)},${clamp(((n>>8)&0xff)+amt)},${clamp((n&0xff)+amt)})`;
}

function makePlaneMat(color: string): THREE.SpriteMaterial {
  const S = 192;
  const cv = document.createElement("canvas");
  cv.width = cv.height = S;
  const g = cv.getContext("2d")!;
  const cx = S / 2, cy = S / 2;

  const dark  = "rgba(0,0,0,0.65)";
  const dim   = "rgba(0,0,0,0.35)";
  const shade = shadeHex(color, -40);

  const fill = (col: string, stroke = dark, lw = 1.5) => {
    g.fillStyle = col; g.strokeStyle = stroke; g.lineWidth = lw;
    g.fill(); g.stroke();
  };

  // ── FUSELAGE – smooth tapered cigar, nose up ──────────────────────────────
  // nose tip: cy-56, tail tip: cy+56
  g.beginPath();
  g.moveTo(cx, cy - 56);
  g.bezierCurveTo(cx + 5,  cy - 42, cx + 8,  cy - 20, cx + 8,  cy);
  g.bezierCurveTo(cx + 8,  cy + 22, cx + 5,  cy + 40, cx + 2,  cy + 56);
  g.lineTo(cx - 2, cy + 56);
  g.bezierCurveTo(cx - 5,  cy + 40, cx - 8,  cy + 22, cx - 8,  cy);
  g.bezierCurveTo(cx - 8,  cy - 20, cx - 5,  cy - 42, cx, cy - 56);
  g.closePath();
  // Longitudinal gradient for subtle 3-D depth
  const fGrd = g.createLinearGradient(cx - 8, 0, cx + 8, 0);
  fGrd.addColorStop(0,   shade);
  fGrd.addColorStop(0.4, color);
  fGrd.addColorStop(0.6, color);
  fGrd.addColorStop(1,   shade);
  g.fillStyle = fGrd;
  g.strokeStyle = dark; g.lineWidth = 1.5;
  g.fill(); g.stroke();

  // ── MAIN WINGS – swept ≈ 28° ──────────────────────────────────────────────
  // root LE: (cx±8, cy-8)  root TE: (cx±8, cy+12)
  // tip  LE: (cx±80, cy+20) tip TE: (cx±70, cy+34)
  g.lineJoin = "round";

  // Right wing
  g.beginPath();
  g.moveTo(cx + 8,  cy - 8);
  g.lineTo(cx + 80, cy + 20);  // tip LE
  g.lineTo(cx + 70, cy + 34);  // tip TE
  g.lineTo(cx + 8,  cy + 12);  // root TE
  g.closePath();
  fill(color, dim, 1.2);

  // Left wing
  g.beginPath();
  g.moveTo(cx - 8,  cy - 8);
  g.lineTo(cx - 80, cy + 20);
  g.lineTo(cx - 70, cy + 34);
  g.lineTo(cx - 8,  cy + 12);
  g.closePath();
  fill(color, dim, 1.2);

  // Leading-edge highlight (shimmer)
  g.beginPath(); g.moveTo(cx + 8, cy - 8); g.lineTo(cx + 80, cy + 20);
  g.strokeStyle = "rgba(255,255,255,0.30)"; g.lineWidth = 2; g.stroke();
  g.beginPath(); g.moveTo(cx - 8, cy - 8); g.lineTo(cx - 80, cy + 20);
  g.stroke();

  // ── WINGLETS – small upswept tip fences ──────────────────────────────────
  g.strokeStyle = color; g.lineWidth = 2.5;
  g.beginPath(); g.moveTo(cx+80,cy+20); g.lineTo(cx+86,cy+12); g.stroke();
  g.beginPath(); g.moveTo(cx-80,cy+20); g.lineTo(cx-86,cy+12); g.stroke();

  // ── ENGINE PODS – under wings ─────────────────────────────────────────────
  const wingAng = Math.atan2(20 - (-8), 80 - 8); // ~24°

  // Right engine
  g.save();
  g.translate(cx + 34, cy + 10);
  g.rotate(wingAng);
  g.beginPath();
  g.ellipse(0, 0, 17, 5.5, 0, 0, Math.PI * 2);
  g.fillStyle = "#111"; g.fill();
  g.beginPath();
  g.ellipse(-7, 0, 8, 4, 0, 0, Math.PI * 2);
  g.fillStyle = "#555"; g.fill(); // inlet highlight
  g.restore();

  // Left engine
  g.save();
  g.translate(cx - 34, cy + 10);
  g.rotate(-wingAng);
  g.beginPath();
  g.ellipse(0, 0, 17, 5.5, 0, 0, Math.PI * 2);
  g.fillStyle = "#111"; g.fill();
  g.beginPath();
  g.ellipse(7, 0, 8, 4, 0, 0, Math.PI * 2);
  g.fillStyle = "#555"; g.fill();
  g.restore();

  // ── HORIZONTAL TAIL STABILIZERS ──────────────────────────────────────────
  // Right stab
  g.beginPath();
  g.moveTo(cx + 3,  cy + 38);
  g.lineTo(cx + 30, cy + 47);
  g.lineTo(cx + 26, cy + 56);
  g.lineTo(cx + 3,  cy + 52);
  g.closePath();
  fill(color, dark, 1.0);

  // Left stab
  g.beginPath();
  g.moveTo(cx - 3,  cy + 38);
  g.lineTo(cx - 30, cy + 47);
  g.lineTo(cx - 26, cy + 56);
  g.lineTo(cx - 3,  cy + 52);
  g.closePath();
  fill(color, dark, 1.0);

  // ── VERTICAL FIN (shadow sliver – top view) ───────────────────────────────
  g.beginPath();
  g.moveTo(cx, cy + 22);
  g.lineTo(cx + 2.5, cy + 56);
  g.lineTo(cx - 2.5, cy + 56);
  g.closePath();
  g.fillStyle = shade; g.fill();

  // ── COCKPIT WINDOW ────────────────────────────────────────────────────────
  g.beginPath();
  g.ellipse(cx, cy - 40, 3.5, 6, 0, 0, Math.PI * 2);
  g.fillStyle = "rgba(160,220,255,0.85)";
  g.strokeStyle = "rgba(0,0,0,0.4)"; g.lineWidth = 0.8;
  g.fill(); g.stroke();

  // ── NOSE CONE highlight ───────────────────────────────────────────────────
  g.beginPath();
  g.moveTo(cx, cy - 56);
  g.bezierCurveTo(cx + 2, cy - 48, cx + 2, cy - 44, cx, cy - 40);
  g.strokeStyle = "rgba(255,255,255,0.35)"; g.lineWidth = 1.5; g.stroke();

  const tex = new THREE.CanvasTexture(cv);
  return new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false, sizeAttenuation: true });
}

// ── ROUTE ARC + AIRCRAFT ──────────────────────────────────────────────────────
const TRAIL = 30;

function RouteArc3D({
  route, extraWps, speedRef, globalRef, posRef, progRef,
  isMtcd, isApw, apwZones, onStartDrag,
}: {
  route: RouteData;
  extraWps: [number,number][];
  speedRef: React.MutableRefObject<Record<string,number>>;
  globalRef: React.MutableRefObject<number>;
  posRef: React.MutableRefObject<Record<string,[number,number]>>;
  progRef: React.MutableRefObject<Record<string,number>>;
  isMtcd: boolean; isApw: boolean; apwZones: SuaZone[];
  onStartDrag: (info: DragInfo) => void;
}) {
  const glowRef   = useRef<THREE.Mesh>(null!);
  const mtcdRef   = useRef<THREE.Mesh>(null!);
  const labelRef  = useRef<THREE.Group>(null!);
  const altRef    = useRef<HTMLSpanElement>(null!);
  const accMs     = useRef(0);

  // Rebuild curve when extra waypoints change
  const effectiveCurve = useMemo(() => {
    const allWps: [number,number][] = [...route.waypointCoords, ...extraWps];
    return new THREE.CatmullRomCurve3(buildArc(route.depCoords, route.destCoords, allWps));
  }, [route.depCoords, route.destCoords, route.waypointCoords, extraWps]);

  const tubeGeo = useMemo(
    () => new THREE.TubeGeometry(effectiveCurve, 140, 0.0025, 5, false),
    [effectiveCurve]
  );

  const trailLine = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(TRAIL*3), 3));
    return new THREE.Line(geo, new THREE.LineBasicMaterial({ color: new THREE.Color(route.color), transparent:true, opacity:0.65 }));
  }, [route.color]);

  const planeMat = useMemo(() => makePlaneMat(route.color), [route.color]);
  const planeSprite = useMemo(() => {
    const s = new THREE.Sprite(planeMat);
    s.scale.set(0.0275, 0.0275, 1);
    return s;
  }, [planeMat]);

  const mtcdMat = useMemo(() => new THREE.MeshBasicMaterial({ color:"#ef4444", transparent:true, opacity:0.85 }), []);

  const durationMs = useMemo(
    () => Math.max(60000, (route.totalKm / (route.speedKnots * 1.852)) * 3_600_000),
    [route.totalKm, route.speedKnots]
  );

  const col = useMemo(() => new THREE.Color(route.color), [route.color]);

  useFrame((state, delta) => {
    const spd = (speedRef.current[route.id] ?? 1) * globalRef.current;
    accMs.current = (accMs.current + delta * 1000 * spd) % durationMs;
    const p = accMs.current / durationMs;
    const pt = effectiveCurve.getPoint(p);
    const dir = pt.clone().normalize();
    const altR = arcAltRatio(p);
    const surf = dir.clone().multiplyScalar(1 + altR * MAX_VISUAL_H);

    // Sprite position
    planeSprite.position.copy(surf);

    // Screen-space heading for sprite rotation
    const { camera } = state;
    const tangent = effectiveCurve.getTangent(p);
    const pt2 = pt.clone().add(tangent.clone().normalize().multiplyScalar(0.06));
    const p1s = pt.clone().project(camera);
    const p2s = pt2.project(camera);
    planeMat.rotation = Math.atan2(-(p2s.x - p1s.x), (p2s.y - p1s.y));

    if (glowRef.current) glowRef.current.position.copy(surf);
    if (mtcdRef.current) {
      mtcdRef.current.position.copy(surf);
      mtcdMat.opacity = 0.45 + 0.5 * Math.sin(state.clock.elapsedTime * 6);
    }
    if (labelRef.current) labelRef.current.position.copy(dir.clone().multiplyScalar(1 + altR * MAX_VISUAL_H + 0.06));
    if (altRef.current) {
      const dispFl = Math.round(getCurrentAltFt(p, route.cruiseAltFt) / 100).toString().padStart(3, "0");
      altRef.current.textContent = `FL${dispFl}`;
    }

    // Trail — each trailing point uses its own altitude ratio
    const posArr = trailLine.geometry.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < TRAIL; i++) {
      const t = Math.max(0, p - i * 0.006);
      const trailDir = effectiveCurve.getPoint(t).clone().normalize();
      const trailAlt = arcAltRatio(t);
      const trailPt = trailDir.multiplyScalar(1 + trailAlt * MAX_VISUAL_H - i * 0.00008);
      posArr.setXYZ(i, trailPt.x, trailPt.y, trailPt.z);
    }
    posArr.needsUpdate = true;

    posRef.current[route.id] = vec3ToLatLon(pt);
    progRef.current[route.id] = p;
  });

  // All effective points for drag insert index
  const allPts: [number,number][] = [route.depCoords, ...route.waypointCoords, ...extraWps, route.destCoords];

  return (
    <group>
      {/* Route tube — clickable to start drag */}
      <mesh
        geometry={tubeGeo}
        onPointerDown={(e) => {
          e.stopPropagation();
          const clickLL = vec3ToLatLon(e.point);
          onStartDrag({
            routeId: route.id, planIdx: route.planIdx,
            insertIdx: findInsertIdx3D(clickLL, allPts), allPts,
          });
        }}
      >
        <meshBasicMaterial color={isMtcd ? new THREE.Color("#ef4444") : col} transparent opacity={isMtcd ? 0.55 : 0.35} />
      </mesh>

      {/* Glow halo */}
      <mesh ref={glowRef}>
        <sphereGeometry args={[0.025, 10, 10]} />
        <meshBasicMaterial color={col} transparent opacity={0.18} />
      </mesh>

      {/* MTCD pulsing ring */}
      {isMtcd && (
        <mesh ref={mtcdRef}>
          <torusGeometry args={[0.038, 0.003, 8, 48]} />
          <primitive object={mtcdMat} attach="material" />
        </mesh>
      )}

      {/* Aircraft sprite */}
      <primitive object={planeSprite} />

      {/* Trail */}
      <primitive object={trailLine} />

      {/* Track label */}
      <group ref={labelRef}>
        <TrackLabel route={route} isMtcd={isMtcd} isApw={isApw} apwZones={apwZones} altRef={altRef} />
      </group>
    </group>
  );
}

// ── BTN STYLE ─────────────────────────────────────────────────────────────────
const BTN: React.CSSProperties = {
  display:"flex", alignItems:"center", gap:6, fontFamily:"monospace", fontSize:10, fontWeight:700,
  padding:"6px 10px", borderRadius:4, cursor:"pointer", userSelect:"none",
  backdropFilter:"blur(6px)", boxShadow:"0 2px 12px rgba(0,0,0,0.5)",
};

// ── CONFLICT POINT MARKER ─────────────────────────────────────────────────────
function ConflictMarker({ pos }: { pos: [number,number] }) {
  const ref = useRef<THREE.Mesh>(null!);
  useFrame(({ clock }) => {
    if (!ref.current) return;
    const s = 1 + 0.35 * Math.abs(Math.sin(clock.elapsedTime * 4));
    ref.current.scale.setScalar(s);
    (ref.current.material as THREE.MeshBasicMaterial).opacity = 0.55 + 0.4 * Math.abs(Math.sin(clock.elapsedTime * 4));
  });
  return (
    <mesh ref={ref} position={latLonToVec3(pos[0], pos[1], 1.016)}>
      <sphereGeometry args={[0.022, 12, 12]} />
      <meshBasicMaterial color="#ef4444" transparent opacity={0.9} />
    </mesh>
  );
}

// ── MAIN GLOBE3D ──────────────────────────────────────────────────────────────
interface Globe3DProps {
  plans: Array<Record<string,string>>;
  lang?: string;
  onWaypointInserted?: (planIdx: number, icao: string, insertAtRouteIdx: number, coord: [number,number]) => void;
  conflictPoint?: [number,number] | null;
  isMtcdGlobal?: boolean;
  extraCoordsLookup?: Record<string,[number,number]>;
}

export default function Globe3D({ plans, lang = "en", onWaypointInserted, conflictPoint, isMtcdGlobal = false, extraCoordsLookup = {} }: Globe3DProps) {
  _extraCoordsLookup = extraCoordsLookup;
  const speedI18n = SPEED_PANEL_I18N[lang] ?? SPEED_PANEL_I18N.en;

  const [globeStyle, setGlobeStyle]     = useState<GlobeStyle>("map");
  const [stylePanelOpen, setStylePanel] = useState(false);
  const [showWaypoints, setShowWaypoints] = useState(false);
  const [showFir, setShowFir]           = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [speedPanelOpen, setSpeedPanel] = useState(false);
  const [speedMultiplierByRoute, setSpeedByRoute] = useState<Record<string,number>>({});
  const [globalMultiplier, setGlobal]   = useState(1);
  const [mtcdPairs, setMtcdPairs]       = useState<Set<string>>(new Set());
  const [apwByRoute, setApwByRoute]     = useState<Record<string,SuaZone[]>>({});
  const [suaZones, setSuaZones]         = useState<SuaZone[]>([]);
  const [bgDots, setBgDots]             = useState<[number,number][]>([]);
  const [bgPoints, setBgPoints]         = useState<[number,number,string][]>([]);
  const [dragInfo, setDragInfo]         = useState<DragInfo | null>(null);
  const [previewSnap, setPreviewSnap]   = useState<PreviewSnap | null>(null);
  const [extraWps3D, setExtraWps3D]     = useState<Record<string,[number,number][]>>({});
  const [liveConflictPt, setLiveConflictPt] = useState<[number,number]|null>(null);

  const containerRef  = useRef<HTMLDivElement>(null);
  const posRef        = useRef<Record<string,[number,number]>>({});
  const progRef       = useRef<Record<string,number>>({});
  const speedRef      = useRef<Record<string,number>>({});
  const globalRef     = useRef(1);
  const previewRef    = useRef<PreviewSnap | null>(null);
  const orbitRef      = useRef<any>(null);

  useEffect(() => { speedRef.current = speedMultiplierByRoute; }, [speedMultiplierByRoute]);
  useEffect(() => { globalRef.current = globalMultiplier; }, [globalMultiplier]);
  useEffect(() => { previewRef.current = previewSnap; }, [previewSnap]);

  useEffect(() => {
    fetch("/sua-zones.json").then(r=>r.json()).then(setSuaZones).catch(()=>{});
    Promise.all([
      fetch("/airports.json").then(r=>r.json()).catch(()=>[]),
      fetch("/waypoints.json").then(r=>r.json()).catch(()=>[]),
    ]).then(([apts,wps]: [[number,number,string][],(number|string)[][]]) => {
      const all: [number,number,string][] = [
        ...apts.map((e: any) => [e[0], e[1], e[2]] as [number,number,string]),
        ...wps.map((e: any) => [e[0], e[1], e[2]] as [number,number,string]),
      ];
      setBgPoints(all);
      setBgDots(all.map(([lat,lon]) => [lat,lon] as [number,number]));
    });
  }, []);

  useEffect(() => {
    const onChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  function toggleFullscreen() {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) containerRef.current.requestFullscreen();
    else document.exitFullscreen();
  }

  const validRoutes: RouteData[] = useMemo(() => {
    if (!plans) return [];
    return plans.flatMap((p, idx) => {
      const dep  = APT[p.departure ?? ""];
      const dest = APT[p.destination ?? ""];
      if (!dep || !dest) return [];
      const tokens = (p.route ?? "").split(/\s+/).filter(s => s && s !== "DCT");
      const wpCoords: [number,number][] = tokens.map(n => lookupCoord(n)).filter(Boolean) as [number,number][];
      const allPts: [number,number][] = [dep, ...wpCoords, dest];
      return [{
        id: `${p.callsign||"plan"}-${idx}`,
        planIdx: idx,
        callsign: p.callsign || `FLT${idx+1}`,
        departureName: p.departure || "",
        destinationName: p.destination || "",
        depCoords: dep, destCoords: dest,
        waypointCoords: wpCoords, waypointNames: tokens,
        color: ROUTE_COLORS[idx % ROUTE_COLORS.length],
        cruiseAltFt: parseFL(p as PlanItem),
        speedKnots: parseSpeed(p as PlanItem),
        totalKm: getMultiDistKm(allPts),
        aircraft_type: p.aircraft_type || "B738",
        flight_level: (p.flight_level || "FL350").toUpperCase(),
        runway: p.runway ?? undefined,
      }];
    });
  }, [plans]);

  // MTCD — live detection + conflict point tracking
  useEffect(() => {
    if (validRoutes.length < 2) { setMtcdPairs(new Set()); setLiveConflictPt(null); return; }
    const id = setInterval(() => {
      const alerts = new Set<string>();
      let foundPt: [number,number] | null = null;
      for (let i = 0; i < validRoutes.length; i++)
        for (let j = i+1; j < validRoutes.length; j++) {
          const r1=validRoutes[i], r2=validRoutes[j];
          const ll1=posRef.current[r1.id], ll2=posRef.current[r2.id];
          if (!ll1||!ll2) continue;
          const alt1=getCurrentAltFt(progRef.current[r1.id]??0, r1.cruiseAltFt);
          const alt2=getCurrentAltFt(progRef.current[r2.id]??0, r2.cruiseAltFt);
          if (haversineKm(ll1,ll2) < 9.26 && Math.abs(alt1-alt2) < 1000) {
            alerts.add(r1.id); alerts.add(r2.id);
            if (!foundPt) foundPt = [(ll1[0]+ll2[0])/2, (ll1[1]+ll2[1])/2];
          }
        }
      setMtcdPairs(alerts);
      setLiveConflictPt(foundPt);
    }, 500);
    return () => clearInterval(id);
  }, [validRoutes]);

  // APW
  useEffect(() => {
    if (!suaZones.length||!validRoutes.length) { setApwByRoute({}); return; }
    const id = setInterval(() => {
      const apw: Record<string,SuaZone[]> = {};
      validRoutes.forEach(r => {
        const ll = posRef.current[r.id]; if (!ll) return;
        const altFl = Math.round(getCurrentAltFt(progRef.current[r.id]??0, r.cruiseAltFt)/100);
        const triggered = suaZones.filter(z => haversineKm(ll,[z.lat,z.lon]) < z.radius_km && altFl>=z.lower_fl && altFl<=z.upper_fl);
        if (triggered.length) apw[r.id] = triggered;
      });
      setApwByRoute(apw);
    }, 500);
    return () => clearInterval(id);
  }, [suaZones, validRoutes]);

  const handleDragMove = useCallback((snap: PreviewSnap | null) => {
    setPreviewSnap(snap);
  }, []);

  const handleDragUp = useCallback(() => {
    const snap = previewRef.current;
    const info = dragInfo;
    if (snap && info) {
      // Route update goes through plans.route (source of truth); no local extraWps needed
      onWaypointInserted?.(info.planIdx, snap.icao, info.insertIdx - 1, snap.latLon);
    }
    setDragInfo(null);
    setPreviewSnap(null);
  }, [dragInfo, onWaypointInserted]);

  function setRouteMultiplier(routeId: string, val: number) {
    setSpeedByRoute(prev => ({ ...prev, [routeId]: val }));
  }

  return (
    <div
      ref={containerRef}
      style={{
        position:"relative", background:"#020810",
        height: isFullscreen ? "100vh" : "28rem",
        borderRadius: isFullscreen ? 0 : "0.5rem", overflow:"hidden",
      }}
    >
      {/* ── TOP-LEFT CONTROLS ── */}
      <div style={{ position:"absolute", top:12, left:12, zIndex:1000, display:"flex", gap:8, alignItems:"flex-start" }}>

        {/* Globe style */}
        <div style={{ display:"flex", flexDirection:"column", gap:4 }}>
          <button onClick={()=>setStylePanel(v=>!v)} style={{ ...BTN, background:"rgba(24,24,27,0.95)", color:"#fff", border:"1px solid rgba(255,255,255,0.12)" }}>
            <span style={{ display:"inline-block", width:12, height:12, borderRadius:2, background:GLOBE_STYLES[globeStyle].swatch, border:"1px solid rgba(255,255,255,0.2)", flexShrink:0 }} />
            <span>{GLOBE_STYLES[globeStyle].label}</span>
            <span style={{ color:"rgba(161,161,170,1)", marginLeft:2 }}>{stylePanelOpen?"▲":"▼"}</span>
          </button>
          {stylePanelOpen && (
            <div style={{ display:"flex", flexDirection:"column", gap:4, background:"rgba(9,9,11,0.95)", backdropFilter:"blur(6px)", border:"1px solid rgba(63,63,70,0.6)", borderRadius:4, padding:6, boxShadow:"0 4px 20px rgba(0,0,0,0.6)" }}>
              {(["satellite","map","dark"] as GlobeStyle[]).map(s => (
                <button key={s} onClick={()=>{ setGlobeStyle(s); setStylePanel(false); }} style={{
                  ...BTN, boxShadow:"none", backdropFilter:"none", padding:"4px 8px", gap:8, border:"none",
                  background: globeStyle===s ? "rgba(37,99,235,0.7)" : "transparent",
                  color: globeStyle===s ? "#fff" : "rgba(212,212,216,1)",
                }}>
                  <span style={{ display:"inline-block", width:14, height:14, borderRadius:2, background:GLOBE_STYLES[s].swatch, border:"1px solid rgba(255,255,255,0.2)", flexShrink:0 }} />
                  {GLOBE_STYLES[s].label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Waypoints toggle */}
        <button onClick={()=>setShowWaypoints(v=>!v)} style={{
          ...BTN,
          background: showWaypoints ? "rgba(24,24,27,0.95)" : "rgba(9,9,11,0.8)",
          color: showWaypoints ? "#fff" : "rgba(113,113,122,1)",
          border: showWaypoints ? "1px solid rgba(82,82,91,0.5)" : "1px solid rgba(63,63,70,0.4)",
        }}>
          <span>{showWaypoints ? "◉" : "○"}</span><span>Waypoints</span>
        </button>

        {/* FIR toggle */}
        <button onClick={()=>setShowFir(v=>!v)} style={{
          ...BTN,
          background: showFir ? "rgba(24,24,27,0.95)" : "rgba(9,9,11,0.8)",
          color: showFir ? "#fff" : "rgba(113,113,122,1)",
          border: showFir ? "1px solid rgba(82,82,91,0.5)" : "1px solid rgba(63,63,70,0.4)",
        }}>
          <span>{showFir ? "◉" : "○"}</span><span>FIR</span>
        </button>
      </div>

      {/* ── FULLSCREEN ── */}
      <div style={{ position:"absolute", bottom:28, right:12, zIndex:1000 }}>
        <button onClick={toggleFullscreen} style={{ ...BTN, background:"rgba(24,24,27,0.95)", color:"#fff", border:"1px solid rgba(82,82,91,0.5)" }}>
          <span>{isFullscreen ? "⊡" : "⊞"}</span><span>{isFullscreen ? "Exit" : "Full"}</span>
        </button>
      </div>

      {/* ── SPEED PANEL ── */}
      {validRoutes.length > 0 && (
        <div style={{ position:"absolute", top:12, right:12, zIndex:1000, display:"flex", flexDirection:"column", alignItems:"flex-end", maxWidth:220 }}>
          <button onClick={()=>setSpeedPanel(v=>!v)} style={{ ...BTN, background:"rgba(24,24,27,0.95)", color:"#fff", border:"1px solid rgba(82,82,91,0.5)" }}>
            <span style={{ color:"#fde047" }}>⏩</span><span>{speedI18n.panel}</span>
            <span style={{ marginLeft:4, color:"rgba(161,161,170,1)" }}>{speedPanelOpen?"▲":"▼"}</span>
          </button>
          {speedPanelOpen && (
            <div style={{ marginTop:4, display:"flex", flexDirection:"column", gap:4, background:"rgba(9,9,11,0.95)", backdropFilter:"blur(6px)", border:"1px solid rgba(63,63,70,0.6)", borderRadius:4, padding:8, width:"100%", boxShadow:"0 4px 20px rgba(0,0,0,0.6)" }}>
              <div style={{ display:"flex", alignItems:"center", gap:4, borderBottom:"1px solid rgba(63,63,70,1)", paddingBottom:4, marginBottom:2 }}>
                <span style={{ fontFamily:"monospace", fontSize:10, fontWeight:700, width:64, color:"rgba(212,212,216,1)", overflow:"hidden", textOverflow:"ellipsis" }}>{speedI18n.all}</span>
                <button onClick={()=>setGlobal(v=>Math.max(1, v===10?1:v-10))} disabled={globalMultiplier<=1} style={{ width:24, height:24, borderRadius:4, background:"rgba(63,63,70,1)", border:"none", color:"#fff", cursor:"pointer", fontWeight:700, opacity:globalMultiplier<=1?0.3:1 }}>−</button>
                <span style={{ color:"#e4e4e7", fontFamily:"monospace", fontSize:10, width:28, textAlign:"center" }}>{globalMultiplier}x</span>
                <button onClick={()=>setGlobal(v=>Math.min(100, v===1?10:v+10))} disabled={globalMultiplier>=100} style={{ width:24, height:24, borderRadius:4, background:"rgba(63,63,70,1)", border:"none", color:"#fff", cursor:"pointer", fontWeight:700, opacity:globalMultiplier>=100?0.3:1 }}>+</button>
              </div>
              {validRoutes.map(r => {
                const mult = speedMultiplierByRoute[r.id] ?? 1;
                return (
                  <div key={r.id} style={{ display:"flex", alignItems:"center", gap:4 }}>
                    <span style={{ fontFamily:"monospace", fontSize:10, fontWeight:700, width:64, color:r.color, overflow:"hidden", textOverflow:"ellipsis" }}>{r.callsign}</span>
                    <button onClick={()=>setRouteMultiplier(r.id, Math.max(1, mult-10))} disabled={mult<=1} style={{ width:24, height:24, borderRadius:4, background:"rgba(63,63,70,1)", border:"none", color:"#fff", cursor:"pointer", fontWeight:700, opacity:mult<=1?0.3:1 }}>−</button>
                    <span style={{ color:"#fff", fontFamily:"monospace", fontSize:10, width:28, textAlign:"center" }}>{mult}x</span>
                    <button onClick={()=>setRouteMultiplier(r.id, Math.min(100, mult===1?10:mult+10))} disabled={mult>=100} style={{ width:24, height:24, borderRadius:4, background:"rgba(63,63,70,1)", border:"none", color:"#fff", cursor:"pointer", fontWeight:700, opacity:mult>=100?0.3:1 }}>+</button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── DRAG HINT ── */}
      {dragInfo && previewSnap && (
        <div style={{ position:"absolute", bottom:60, left:"50%", transform:"translateX(-50%)", zIndex:1000, background:"rgba(9,9,11,0.9)", border:"1px solid #facc15", borderRadius:4, padding:"4px 10px", fontFamily:"monospace", fontSize:10, color:"#facc15", pointerEvents:"none" }}>
          ↪ {previewSnap.icao}
        </div>
      )}

      {/* ── CANVAS ── */}
      <Canvas camera={{ position:[0,0,2.7], fov:45 }} gl={{ antialias:true }} style={{ height:"100%", width:"100%" }}>
        <ambientLight intensity={0.9} />
        <directionalLight position={[5,3,5]} intensity={1.4} color="#fff8f0" />
        <directionalLight position={[-4,-1,-3]} intensity={0.4} color="#88aaff" />
        <Stars radius={120} depth={60} count={6000} factor={4} saturation={0} fade speed={0.3} />

        <Earth style={globeStyle} />
        <CountryBorders />
        {showFir && <FirBoundaries3D />}
        {suaZones.map(z => <SuaRing key={z.id} zone={z} />)}
        {showWaypoints && bgDots.length > 0 && <BackgroundDots data={bgDots} />}

        {/* Route airport dots */}
        {validRoutes.flatMap(r => [
          <mesh key={`dep-${r.id}`} position={latLonToVec3(r.depCoords[0], r.depCoords[1], 1.013)}>
            <sphereGeometry args={[0.0035,8,8]}/><meshBasicMaterial color={r.color}/>
          </mesh>,
          <mesh key={`dest-${r.id}`} position={latLonToVec3(r.destCoords[0], r.destCoords[1], 1.013)}>
            <sphereGeometry args={[0.0035,8,8]}/><meshBasicMaterial color={r.color}/>
          </mesh>,
        ])}

        {/* MTCD conflict point marker */}
        {(conflictPoint || liveConflictPt) && (
          <ConflictMarker pos={(conflictPoint ?? liveConflictPt)!} />
        )}

        {/* Route arcs + aircraft */}
        {validRoutes.map(r => (
          <RouteArc3D
            key={r.id} route={r}
            extraWps={extraWps3D[r.id] ?? []}
            speedRef={speedRef} globalRef={globalRef}
            posRef={posRef} progRef={progRef}
            isMtcd={mtcdPairs.has(r.id)}
            isApw={(apwByRoute[r.id]?.length ?? 0) > 0}
            apwZones={apwByRoute[r.id] ?? []}
            onStartDrag={setDragInfo}
          />
        ))}

        {/* Preview dot during drag */}
        {previewSnap && (
          <mesh position={latLonToVec3(previewSnap.latLon[0], previewSnap.latLon[1], 1.016)}>
            <sphereGeometry args={[0.016,12,12]}/><meshBasicMaterial color="#facc15"/>
          </mesh>
        )}

        <DragController
          isDragging={dragInfo !== null}
          bgPoints={bgPoints}
          onMove={handleDragMove}
          onUp={handleDragUp}
          orbitRef={orbitRef}
        />

        <OrbitControls ref={orbitRef} enablePan={false} minDistance={1.4} maxDistance={5} />
      </Canvas>
    </div>
  );
}
