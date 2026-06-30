from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import os
import json
import re
import math
import itertools

try:
	import openai
except Exception:
	openai = None

from tpl_generator import generate_tpl, validate_plan

app = FastAPI(title="ATM TPL Generator")

app.add_middleware(
	CORSMiddleware,
	allow_origins=["*"],
	allow_credentials=True,
	allow_methods=["*"],
	allow_headers=["*"],
)


class PromptIn(BaseModel):
	prompt: str


DEFAULT_PROMPT = "Flight between Vienna and Paris at FL350"


ICAO_AIRPORTS = {
	"vienne": "LOWW",
	"vienna": "LOWW",
	"paris": "LFPG",
	"singapore": "WSSS",
	"singapour": "WSSS",
	"london": "EGLL",
	"londres": "EGLL",
	"berlin": "EDDT",
	"rome": "LIRF",
	"roma": "LIRF",
	"madrid": "LEMD",
	"amsterdam": "EHAM",
	"brussels": "EBBR",
	"bruxelles": "EBBR",
	"zurich": "LSZH",
	"geneva": "LSGG",
	"geneve": "LSGG",
	"genève": "LSGG",
	"copenhagen": "EKCH",
	"stockholm": "ESSA",
	"oslo": "ENGM",
	"athens": "LGAV",
	"dublin": "EIDW",
	"lisbon": "LPPT",
	"marseille": "LFML",
	"lyon": "LFLL",
	"nice": "LFMN",
	"new york": "KJFK",
	"nyc": "KJFK",
	"los angeles": "KLAX",
	"san francisco": "KSFO",
	"chicago": "KORD",
	"miami": "KMIA",
	"houston": "KIAH",
	"toronto": "CYYZ",
	"montreal": "CYUL",
	"tokyo": "RJTT",
	"seoul": "RKSS",
	"bangkok": "VTBS",
	"delhi": "VIDP",
	"mumbai": "VABB",
	"chennai": "VOMM",
	"madras": "VOMM",
	"bengaluru": "VOBL",
	"bangalore": "VOBL",
	"kochi": "VOCI",
	"cochin": "VOCI",
	"hyderabad": "VOHS",
	"karachi": "OPKC",
	"islamabad": "OPIS",
	"lahore": "OPLA",
	"dubai": "OMDB",
	"dubaï": "OMDB",
	"abu dhabi": "OMAA",
	"doha": "OTBD",
	"riyadh": "OERK",
	"riyad": "OERK",
	"jeddah": "OEJN",
	"jedda": "OEJN",
	"kuala lumpur": "WMKK",
	"beijing": "ZBAA",
	"pekin": "ZBAA",
	"pékin": "ZBAA",
	"shanghai": "ZSPD",
	"chengdu": "ZUUU",
	"sydney": "YSSY",
	"melbourne": "YMML",
	"johannesburg": "FAOR",
	"cape town": "FACT",
}


def _to_icao_code(value: str | None) -> str | None:
	if not value:
		return value
	text = str(value).strip()
	if not text:
		return text
	# City name lookup first (e.g. "Rome" → "LIRF", not treated as 4-letter ICAO)
	key = re.sub(r"[^a-zà-ÿ]", " ", text.lower()).strip()
	key = " ".join(key.split())
	if key in ICAO_AIRPORTS:
		return ICAO_AIRPORTS[key]
	# Then treat as ICAO code if it's exactly 4 alpha chars
	upper = text.upper()
	if len(upper) == 4 and upper.isalpha():
		return upper
	letters = "".join(ch for ch in text if ch.isalpha())
	return (letters[:4].upper() or "XXXX")


def _normalize_prompt(prompt: str | None) -> str:
	text = (prompt or "").strip()
	return text or DEFAULT_PROMPT


def _split_prompts(prompt: str) -> list[str]:
	lines = [line.strip() for line in re.split(r"[\r\n]+", prompt) if line.strip()]
	return lines or [DEFAULT_PROMPT]


def _parse_prompt_line(prompt: str) -> dict:
	try:
		return _llm_parse(prompt)
	except Exception:
		return _fallback_parse(prompt)


def _normalize_plan(plan: dict | list[dict]) -> dict | list[dict]:
	if isinstance(plan, list):
		return [_normalize_plan(p) for p in plan]  # type: ignore[return-value]
	out = dict(plan)
	out["departure"] = _to_icao_code(out.get("departure"))
	out["destination"] = _to_icao_code(out.get("destination"))
	return out


def _fallback_parse(prompt: str) -> dict:
	out = {
		"callsign": None,
		"departure": None,
		"destination": None,
		"flight_level": None,
		"aircraft_type": None,
		"route": None,
		"departure_date": None,
		"speed": None,
	}
	prompt = _normalize_prompt(prompt)
	text = prompt.lower()
	# Strip waypoint clauses so they don't pollute the dep/dest capture groups
	text_clean = re.sub(
		r"\b(?:avec|with)\s+(?:des\s+)?(?:waypoints?|balises?)\b",
		"",
		text,
	).strip()
	m = re.search(
		r"(?:from|between|entre|de)\s+([A-Za-zÀ-ÿ\s-]+?)\s+(?:to|et|and|vers|à|a)\s+([A-Za-zÀ-ÿ\s-]+?)(?=\s*(?:at|fl|sans|via|avoid|en\s|in\s|avec\s|with\s|$))",
		text_clean,
		re.IGNORECASE,
	)
	if m:
		out["departure"] = m.group(1).strip().title()
		out["destination"] = m.group(2).strip().title()

	m2 = re.search(r"fl(?:ight level|)?\s*?(\d{2,3})", text)
	if not m2:
		m2 = re.search(r"fl(\d{2,3})", text)
	if m2:
		out["flight_level"] = f"FL{m2.group(1)}"

	m3 = re.search(r"callsign\s+([A-Za-z0-9-]+)", text)
	if m3:
		out["callsign"] = m3.group(1).upper()

	if not out["departure"]:
		out["departure"] = "UNKNOWN"
	if not out["destination"]:
		out["destination"] = "UNKNOWN"

	if _wants_waypoints(text):
		out["wants_waypoints"] = True
		out["_waypoint_bbox"] = _detect_waypoint_country_bbox(text)
		out["_waypoint_count"] = _parse_waypoint_count(text)

	return out


def _llm_parse(prompt: str) -> dict:
	api_key = os.getenv("OPENAI_API_KEY")
	if not api_key or openai is None:
		raise RuntimeError("OpenAI not available")
	openai.api_key = api_key
	system = (
		"You are a parser that converts a single-line natural language flight request into a JSON object "
		"with fields: callsign, departure, destination, flight_level, aircraft_type, route, departure_date, speed. "
		"Return only valid JSON without extra commentary."
	)
	try:
		resp = openai.ChatCompletion.create(
			model=os.getenv("OPENAI_MODEL", "gpt-4o-mini"),
			messages=[{"role": "system", "content": system}, {"role": "user", "content": prompt}],
			max_tokens=300,
			temperature=0,
		)
		text = resp["choices"][0]["message"]["content"].strip()
		return json.loads(text)
	except Exception as e:
		raise RuntimeError(f"LLM parse failed: {e}")


def _is_mtcd_request(prompt: str) -> bool:
	return "mtcd" in prompt.lower()


def _wants_waypoints(text: str) -> bool:
	lower = text.lower()
	return any(kw in lower for kw in [
		"waypoint", "waypoints", "balise", "balises",
		"avec waypoints", "avec balises", "with waypoints", "via waypoint",
	])


_WORD_NUMBERS = {
	"un": 1, "une": 1, "one": 1,
	"deux": 2, "two": 2,
	"trois": 3, "three": 3,
	"quatre": 4, "four": 4,
	"cinq": 5, "five": 5,
	"six": 6,
}

def _parse_waypoint_count(text: str) -> int:
	"""Return explicitly requested waypoint count, or 6 as default."""
	lower = text.lower()
	# Match digit: "1 waypoint", "3 balises"
	m = re.search(r"(\d+)\s+(?:des\s+)?(?:waypoints?|balises?)", lower)
	if m:
		return max(1, min(int(m.group(1)), 20))
	# Match word number: "un waypoint", "deux balises"
	for word, num in _WORD_NUMBERS.items():
		if re.search(rf"\b{word}\s+(?:des\s+)?(?:waypoints?|balises?)\b", lower):
			return num
	return 6


# ── Airport coordinates (used for dynamic MTCD route search) ─────────────────
_APT: dict[str, tuple[float, float]] = {
	"LOWW":(48.11,16.57),"LFPG":(49.01,2.55),"EGLL":(51.47,-0.45),
	"EDDT":(52.56,13.29),"LIRF":(41.80,12.24),"LEMD":(40.47,-3.56),
	"EHAM":(52.31,4.77),"EBBR":(50.90,4.48),"LSZH":(47.46,8.55),
	"LSGG":(46.24,6.11),"LFML":(43.44,5.22),"LFLL":(45.73,5.08),
	"LFMN":(43.66,7.22),"EKCH":(55.62,12.66),"ESSA":(59.65,17.92),
	"ENGM":(60.20,11.10),"LGAV":(37.94,23.94),"EIDW":(53.42,-6.27),
	"LPPT":(38.78,-9.14),"LHBP":(47.43,19.26),"EPWA":(52.17,20.97),
	"LKPR":(50.10,14.26),"LIMC":(45.63,8.73),"EDDM":(48.35,11.79),
	"EDDF":(50.03,8.57),"EDDL":(51.28,6.77),"EDDH":(53.63,9.99),
	"LEBL":(41.30,2.07),"LFBO":(43.63,1.37),"LEBB":(43.30,-2.91),
	"LEMG":(36.67,-4.50),"LEZL":(37.42,-5.89),"LIRN":(40.89,14.29),
	"LIMJ":(44.41,8.84),"LIPZ":(45.50,12.36),"LBSF":(42.70,23.41),
	"LROP":(44.57,26.10),"LZIB":(48.17,17.21),"LYBE":(44.82,20.31),
	"LDZA":(45.74,16.07),"LJLJ":(46.22,14.46),"LOWS":(47.79,13.00),
	"LOWI":(47.26,11.34),"LSZB":(46.91,7.50),
	# Asia / Middle East
	"WSSS":(1.350,103.989),"VTBS":(13.681,100.750),"WMKK":(2.745,101.710),
	"VIDP":(28.557, 77.101),"VABB":(19.096, 72.875),"VOMM":(12.994, 80.179),
	"VOBL":(13.198, 77.707),"VOCI":(10.153, 76.394),"VOHS":(17.231, 78.430),
	"OPKC":(24.906, 67.161),"OPIS":(33.617, 73.099),"OPLA":(31.521, 74.404),
	"OMDB":(25.252, 55.364),"OMAA":(24.433, 54.651),
	"OTBD":(25.273, 51.608),
	"OERK":(24.958, 46.698),"OEJN":(21.679, 39.156),
	"ZBAA":(40.080,116.584),"ZSPD":(31.143,121.805),"ZUUU":(30.578,103.947),
	"RJTT":(35.553,139.781),"RKSS":(37.469,126.451),
	# Americas
	"KJFK":(40.638,-73.779),"KLAX":(33.943,-118.408),"KSFO":(37.619,-122.375),
	"KORD":(41.979,-87.905),"KMIA":(25.796,-80.287),"KIAH":(29.984,-95.342),
	"CYYZ":(43.677,-79.630),"CYUL":(45.470,-73.740),
	# Africa / Oceania
	"FAOR":(-26.136,28.242),"FACT":(-33.964,18.602),
	"YSSY":(-33.946,151.177),"YMML":(-37.673,144.843),
}

# ── Country name → bounding box (lat_min, lat_max, lon_min, lon_max) ─────────
_COUNTRY_BBOXES: dict[str, tuple[float,float,float,float]] = {
	"france":      (42.3,51.1,-5.1,8.3),
	"germany":     (47.3,55.1, 5.9,15.1),
	"spain":       (36.0,44.0,-9.5, 3.5),
	"italy":       (36.7,47.1, 6.6,18.5),
	"netherlands": (50.7,53.6, 3.2, 7.2),
	"belgium":     (49.5,51.5, 2.5, 6.4),
	"switzerland": (45.8,47.8, 5.9,10.5),
	"austria":     (46.4,49.0, 9.5,17.2),
	"portugal":    (37.0,42.2,-9.5,-5.5),
	"greece":      (35.0,42.0,19.3,26.6),
	"denmark":     (54.6,57.8, 8.1,15.2),
	"sweden":      (55.4,69.1,11.1,24.2),
	"norway":      (57.9,71.2, 4.5,31.1),
	"poland":      (49.0,54.8,14.1,24.2),
	"czech":       (48.6,51.1,12.1,18.9),
	"hungary":     (45.7,48.6,16.1,22.9),
	"romania":     (43.6,48.3,20.2,29.7),
	"serbia":      (42.2,46.2,18.8,23.0),
	"croatia":     (42.4,46.6,13.4,19.5),
	"slovenia":    (45.4,46.9,13.4,16.6),
	"slovakia":    (47.7,49.6,16.8,22.6),
	"bulgaria":    (41.2,44.2,22.4,28.6),
	"ukraine":     (44.4,52.4,22.1,40.2),
	"turkey":      (36.0,42.1,26.0,44.8),
	"uk":          (49.9,60.9,-8.2, 2.0),
	# Asia / Middle East
	"india":       ( 8.0,37.0, 68.0, 97.5),
	"pakistan":    (23.5,37.5, 60.5, 75.5),
	"iran":        (25.0,40.0, 44.0, 63.5),
	"uae":         (22.5,26.5, 51.0, 56.5),
	"saudi_arabia":(15.0,32.5, 36.0, 56.5),
	"qatar":       (24.5,26.5, 50.5, 52.5),
	"oman":        (16.5,26.5, 51.8, 59.8),
	"thailand":    ( 5.5,20.5, 97.5,105.8),
	"malaysia":    ( 1.0, 7.5, 99.5,119.5),
	"singapore":   ( 1.1, 1.5,103.5,104.1),
	"bangladesh":  (20.5,26.5, 88.0, 92.5),
	"china":       (18.0,53.6, 73.0,135.0),
	"japan":       (24.0,46.0,122.0,146.0),
	"south_korea": (33.0,38.7,125.5,130.0),
	"nepal":       (26.3,30.5, 80.0, 88.2),
	"sri_lanka":   ( 5.9, 9.9, 79.5, 81.9),
}

_COUNTRY_KEYWORDS_MAP: list[tuple[str, list[str]]] = [
	("germany",     ["germany","allemagne","deutschland","alemania"]),
	("spain",       ["spain","espagne","españa","espana","espania"]),
	("italy",       ["italy","italie","italia"]),
	("france",      ["france"]),
	("netherlands", ["netherlands","nederland","pays-bas","holland","hollande"]),
	("belgium",     ["belgium","belgique","belgien","belgica"]),
	("switzerland", ["switzerland","suisse","schweiz","svizzera"]),
	("austria",     ["austria","autriche","österreich","osterreich"]),
	("portugal",    ["portugal"]),
	("greece",      ["greece","grece","grèce","grecia","hellas"]),
	("denmark",     ["denmark","danemark","dänemark","danimarca","dinamarca"]),
	("sweden",      ["sweden","suede","suède","svezia","suecia"]),
	("norway",      ["norway","norvege","norvège","norvegia","noruega"]),
	("poland",      ["poland","pologne","polen","polonia"]),
	("czech",       ["czech","czechia","tchequie","tchéquie","tschechien","república checa"]),
	("hungary",     ["hungary","hongrie","ungarn","ungheria","hungria"]),
	("romania",     ["romania","roumanie","rumänien","rumania"]),
	("serbia",      ["serbia","serbie","serbien"]),
	("croatia",     ["croatia","croatie","kroatien","croazia"]),
	("slovenia",    ["slovenia","slovenie","slowenien"]),
	("slovakia",    ["slovakia","slovaquie","slowakei"]),
	("bulgaria",    ["bulgaria","bulgarie","bulgarien"]),
	("ukraine",     ["ukraine","ucrania"]),
	("turkey",      ["turkey","turquie","türkei","turchia","turquia"]),
	("uk",          ["united kingdom","royaume-uni","royaume uni","england","angleterre","britain","grande-bretagne"]),
	# Asia / Middle East
	("india",       ["india","inde","indien","india"]),
	("pakistan",    ["pakistan"]),
	("iran",        ["iran","perse","persia"]),
	("uae",         ["uae","emirates","emirats","émirats","dubai","dubaï","abu dhabi"]),
	("saudi_arabia",["saudi","arabie saoudite","saudi arabia","arabia saudita","riyad","riyadh"]),
	("qatar",       ["qatar","katar"]),
	("oman",        ["oman"]),
	("thailand",    ["thailand","thaïlande","thailande","thaïlande","thai"]),
	("malaysia",    ["malaysia","malaisie","malasia"]),
	("singapore",   ["singapore","singapour","singapur"]),
	("bangladesh",  ["bangladesh","bengale"]),
	("china",       ["china","chine","chinesisch"]),
	("japan",       ["japan","japon","giappone","japón","japon"]),
	("south_korea", ["south korea","coree du sud","corée du sud","korea","coree"]),
	("nepal",       ["nepal","népal"]),
	("sri_lanka",   ["sri lanka","sri-lanka","ceylan"]),
]


def _haversine_km(A: tuple[float,float], B: tuple[float,float]) -> float:
	R = 6371.0
	dlat = math.radians(B[0]-A[0]); dlon = math.radians(B[1]-A[1])
	a = math.sin(dlat/2)**2 + math.cos(math.radians(A[0]))*math.cos(math.radians(B[0]))*math.sin(dlon/2)**2
	return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))


def _initial_bearing(A: tuple[float,float], B: tuple[float,float]) -> float:
	"""True bearing in degrees [0, 360) from A to B."""
	lat1, lon1 = math.radians(A[0]), math.radians(A[1])
	lat2, lon2 = math.radians(B[0]), math.radians(B[1])
	x = math.sin(lon2 - lon1) * math.cos(lat2)
	y = math.cos(lat1) * math.sin(lat2) - math.sin(lat1) * math.cos(lat2) * math.cos(lon2 - lon1)
	return (math.degrees(math.atan2(x, y)) + 360) % 360


def _departure_runway(dep: tuple[float,float], dest: tuple[float,float]) -> str:
	"""Return a plausible runway designation based on departure heading."""
	bearing = _initial_bearing(dep, dest)
	rwy_num = round(bearing / 10) % 36
	if rwy_num == 0:
		rwy_num = 36
	# Alternate L/R based on the exact bearing within each 10° band
	suffix = "L" if int(bearing) % 20 < 10 else "R"
	return f"{rwy_num:02d}{suffix}"


def _line_intersect(A1, A2, B1, B2):
	"""Return (lat, lon, t, s) where routes A and B cross, or None."""
	da_lat, da_lon = A2[0]-A1[0], A2[1]-A1[1]
	db_lat, db_lon = B2[0]-B1[0], B2[1]-B1[1]
	c_lat, c_lon   = B1[0]-A1[0], B1[1]-A1[1]
	det = da_lat*(-db_lon) - da_lon*(-db_lat)
	if abs(det) < 1e-9:
		return None
	t = (c_lat*(-db_lon) - c_lon*(-db_lat)) / det
	s = (da_lat*c_lon   - da_lon*c_lat)    / det
	if not (0.12 < t < 0.88 and 0.12 < s < 0.88):
		return None
	return A1[0]+t*da_lat, A1[1]+t*da_lon, t, s


def _find_mtcd_routes(bbox: tuple[float,float,float,float]):
	"""Search all airport-pair combos for two crossing routes inside bbox."""
	lat0, lat1, lon0, lon1 = bbox
	codes = list(_APT.keys())
	best_ratio = 1.8
	best = None
	pairs = [(a, b) for i,a in enumerate(codes) for b in codes[i+1:]]
	for (a1c, a2c), (b1c, b2c) in itertools.combinations(pairs, 2):
		if {a1c, a2c} & {b1c, b2c}:
			continue
		r = _line_intersect(_APT[a1c], _APT[a2c], _APT[b1c], _APT[b2c])
		if not r:
			continue
		lat, lon, t, s = r
		if not (lat0 < lat < lat1 and lon0 < lon < lon1):
			continue
		dA = _haversine_km(_APT[a1c], _APT[a2c]) * t
		dB = _haversine_km(_APT[b1c], _APT[b2c]) * s
		if dA < 180 or dB < 180:
			continue
		ratio = max(dA, dB) / min(dA, dB)
		if ratio < best_ratio:
			best_ratio = ratio
			best = (a1c, a2c, b1c, b2c, lat, lon, dA, dB)
	return best


def _detect_mtcd_country(prompt: str) -> str:
	lower = prompt.lower()
	for country, keywords in _COUNTRY_KEYWORDS_MAP:
		if any(kw in lower for kw in keywords):
			return country
	return "france"


# ── En-route waypoint database ────────────────────────────────────────────────
_ALL_WAYPOINTS: list[tuple[str, float, float]] = [
	# Existing (from waypoints.json / major corridors)
	("PERON", 50.917, 1.750), ("KONAN", 50.217, 3.450), ("VESAN", 48.517, 4.033),
	("OKMET", 45.000, 2.400), ("SOBIT", 43.617, 5.450), ("AMVAR", 43.000, 6.833),
	("LORKU", 47.717, 7.567), ("NATOR", 46.833, 8.500), ("MILPA", 45.483, 11.600),
	("ROTUN", 43.033, 11.017), ("LABAL", 41.500, 13.567), ("IRMAR", 37.733, 15.200),
	("KANIG", 47.833, 16.667), ("GIVMI", 46.900, 19.050), ("RUDUS", 45.333, 20.167),
	("PESAT", 43.833, 22.500), ("ADOSA", 41.267, 26.417), ("KOBAN", 41.033, 29.000),
	("RIDSU", 38.000, 35.000), ("DESDI", 36.500, 36.833), ("MOGOL", 24.000, 45.000),
	("DITOX", 20.000, 56.000), ("NIBDA", 20.000, 73.000), ("NILAK", 10.000, 80.000),
	("PEXEG", 13.000, 77.000), ("KELOR",  5.000,100.000), ("BIKTA",  1.500,104.000),
	("DOLIR", 55.000,-15.000), ("SOMAX", 54.000,-20.000), ("MIMKU", 53.000,-30.000),
	("LASNO", 50.000,-40.000), ("RAFOX", 50.000,-55.000), ("PIKIL", 49.000,-50.000),
	("SCROD", 46.000,-53.000), ("NARAK", 44.300, -2.667), ("RESMI", 37.667, -7.767),
	("PEKLO", 40.000, 75.000), ("SADOL", 35.000, 90.000), ("SANKO", 30.000,100.000),
	("BETUL", 10.000, 20.000), ("NAVIX",  0.000, 35.000),
	# France
	("TRESO", 48.867, 2.167), ("MOLBA", 49.250, 1.833), ("ETAMO", 47.283, 5.867),
	("RENAR", 48.083, 7.367), ("DIKOL", 43.967, 3.000), ("BORDI", 44.383,-0.117),
	("LERGA", 43.117,-0.600), ("TOPTU", 46.633, 0.267), ("RONNY", 49.500, 3.033),
	("ODINA", 47.167, 2.167),
	# UK
	("LAMSO", 51.417,-1.083), ("TIMBA", 52.183,-0.767), ("WOTAN", 53.450,-2.583),
	("DIKAS", 50.917,-1.667), ("MONTY", 55.600,-2.350), ("CLACT", 51.783, 1.150),
	# Germany
	("DOMUX", 48.317, 9.933), ("ABGAS", 51.183,11.583), ("POVEL", 52.767,13.950),
	("RISGA", 53.217,10.717), ("KERAX", 49.317,12.133), ("ROKIL", 51.583, 7.450),
	("REDGO", 50.133, 8.083), ("INBED", 47.650,10.533),
	# Spain
	("VIBAS", 43.167,-1.683), ("DELOG", 41.433,-3.850), ("BELEN", 38.867,-3.700),
	("SUGOL", 42.633,-7.467), ("TOLVU", 40.383,-1.583), ("LUBET", 36.750,-4.350),
	# Italy
	("ADEBA", 43.717,10.367), ("BOLIV", 44.500,11.333), ("NIXSO", 41.050,15.950),
	("DEGVU", 44.117, 8.433), ("SIVOM", 39.933,18.367),
	# Switzerland / Austria
	("DITON", 47.017, 6.583), ("VEBIT", 46.350, 9.450), ("LATLO", 47.483,13.250),
	("MASEX", 48.550,14.767),
	# Benelux
	("HELEN", 50.500, 3.167), ("RUSIT", 52.083, 5.083), ("DENUT", 51.717, 3.167),
	# Scandinavia
	("NORKU", 57.767,10.067), ("PERAN", 56.067,14.733), ("REKNA", 58.033,11.550),
	("ELPAS", 60.500,11.267),
	# Eastern Europe
	("PESEK", 50.733,16.167), ("LOKVU", 48.400,18.317), ("BOGNA", 46.350,15.217),
	("REKOX", 44.783,21.717), ("KELOM", 46.117,23.867),
	# Greece / Turkey
	("NIRVA", 38.233,20.717), ("SOSNA", 36.750,22.633), ("OVRIX", 36.333,32.617),
	# Portugal
	("PASIV", 40.467,-7.267), ("OBELO", 38.817,-8.950),
	# Middle East / Gulf
	("LOBNA", 33.500,38.833),
	("TEHRI", 35.500,51.500), ("IRNAK", 29.500,57.500),
	("DUBWI", 25.200,55.400), ("MUSCO", 23.500,58.500),
	("JEFDA", 21.700,39.200),
	# India
	("KARNI", 28.500,77.500), ("DEVOS", 25.000,80.500),
	("OPLOT", 21.500,72.500), ("NAKBU", 17.500,78.500),
	("SULAM", 15.000,74.500), ("GANDU", 21.500,85.000),
	("TALIP", 10.500,77.500),
	# Pakistan / Central Asia
	("PAKSO", 30.000,70.000), ("ISLAB", 33.500,73.000),
	# South / Southeast Asia
	("BANGO", 13.800,100.800), ("KULMP",  3.100,101.500),
	# China
	("CHENG", 30.500,104.000), ("WUHAN", 30.600,114.100),
	("BEIJK", 39.900,116.400),
]


def _detect_waypoint_country_bbox(prompt: str):
	"""Return country bbox if explicitly mentioned, else None."""
	lower = prompt.lower()
	for country, keywords in _COUNTRY_KEYWORDS_MAP:
		if any(kw in lower for kw in keywords):
			return _COUNTRY_BBOXES.get(country)
	return None


def _select_route_waypoints(
	dep: tuple[float, float],
	dest: tuple[float, float],
	bbox=None,
	n_max: int = 6,
	dep_code: str = "",
	dest_code: str = "",
) -> list[str]:
	"""Return up to n_max waypoint/airport names along the dep→dest route."""
	dep_lat, dep_lon = dep
	dest_lat, dest_lon = dest
	dx = dest_lon - dep_lon
	dy = dest_lat - dep_lat
	len2 = dx * dx + dy * dy
	route_km = _haversine_km(dep, dest)
	if route_km < 80 or len2 < 1e-9:
		return []
	threshold_km = max(80.0, route_km * 0.18)
	# Combine en-route waypoints + airports (airports excluded if dep or dest)
	pool: list[tuple[str, float, float]] = list(_ALL_WAYPOINTS)
	for icao, (alat, alon) in _APT.items():
		if icao != dep_code and icao != dest_code:
			pool.append((icao, alat, alon))
	candidates: list[tuple[float, float, str]] = []
	for name, wlat, wlon in pool:
		if bbox:
			lat0, lat1, lon0, lon1 = bbox
			if not (lat0 <= wlat <= lat1 and lon0 <= wlon <= lon1):
				continue
		t = ((wlon - dep_lon) * dx + (wlat - dep_lat) * dy) / len2
		if not (0.05 < t < 0.95):
			continue
		proj_lat = dep_lat + t * dy
		proj_lon = dep_lon + t * dx
		cross_km = _haversine_km((wlat, wlon), (proj_lat, proj_lon))
		if cross_km > threshold_km:
			continue
		candidates.append((t, cross_km, name))
	candidates.sort()
	if not candidates:
		return []
	if len(candidates) <= n_max:
		return [c[2] for c in candidates]
	step = len(candidates) / n_max
	return [candidates[int(i * step)][2] for i in range(n_max)]


def _create_mtcd_scenario(prompt: str) -> tuple[list[dict], list[float]]:
	country = _detect_mtcd_country(prompt)
	bbox = _COUNTRY_BBOXES.get(country, _COUNTRY_BBOXES["france"])
	result = _find_mtcd_routes(bbox)
	if result is None:
		# fallback to France if no crossing found
		result = _find_mtcd_routes(_COUNTRY_BBOXES["france"])
	a1c, a2c, b1c, b2c, lat, lon, dA, dB = result  # type: ignore[misc]
	spd_A = 450
	spd_B = round(spd_A * dB / dA)
	spd_B = max(350, min(600, spd_B))
	plans = [
		{"callsign":"A1001","departure":a1c,"destination":a2c,
		 "cruise_speed":f"{spd_A:04d}","aircraft_type":"B738",
		 "flight_level":"FL350","route":"DCT","operator":"AF","initial_accumulated_ms":0},
		{"callsign":"A1002","departure":b1c,"destination":b2c,
		 "cruise_speed":f"{spd_B:04d}","aircraft_type":"A320",
		 "flight_level":"FL350","route":"DCT","operator":"AF","initial_accumulated_ms":0},
	]
	return plans, [round(lat, 4), round(lon, 4)]


@app.post("/generate-tpl")
async def generate_tpl_endpoint(body: PromptIn):
	prompt = _normalize_prompt(body.prompt)
	lines = _split_prompts(prompt)

	mtcd_lines = [l for l in lines if _is_mtcd_request(l)]
	regular_lines = [l for l in lines if not _is_mtcd_request(l)]

	all_plans: list[dict] = []
	conflict_point = None
	is_mtcd = False

	if mtcd_lines:
		mtcd_plans, conflict_point = _create_mtcd_scenario(mtcd_lines[0])
		all_plans.extend(mtcd_plans)
		is_mtcd = True

	for line in regular_lines:
		plan = _parse_prompt_line(line)
		plan = _normalize_plan(plan)
		all_plans.append(plan)

	used_callsigns = {p.get("callsign") for p in all_plans if p.get("callsign")}
	counter = 1001
	for plan in all_plans:
		if not plan.get("callsign"):
			while f"A{counter}" in used_callsigns:
				counter += 1
			plan["callsign"] = f"A{counter}"
			used_callsigns.add(plan["callsign"])
			counter += 1

	for plan in all_plans:
		if plan.pop("wants_waypoints", False):
			dep_coords = _APT.get(plan.get("departure", ""))
			dest_coords = _APT.get(plan.get("destination", ""))
			if dep_coords and dest_coords:
				bbox = plan.pop("_waypoint_bbox", None)
				n = plan.pop("_waypoint_count", 6)
				wpts = _select_route_waypoints(
						dep_coords, dest_coords, bbox, n_max=n,
						dep_code=plan.get("departure", ""),
						dest_code=plan.get("destination", ""),
					)
				if wpts:
					plan["route"] = " ".join(wpts)
			plan.pop("_waypoint_bbox", None)
			plan.pop("_waypoint_count", None)

	# Attach departure runway to every plan that has known airport coords
	for plan in all_plans:
		dep_coords = _APT.get(plan.get("departure", ""))
		dest_coords = _APT.get(plan.get("destination", ""))
		if dep_coords and dest_coords:
			plan["runway"] = _departure_runway(dep_coords, dest_coords)

	try:
		validate_plan(all_plans)
	except Exception as e:
		raise HTTPException(status_code=400, detail=str(e))

	tpl = generate_tpl(all_plans)
	filename = "mtcd-alert.tpl" if is_mtcd else (
		"multi-plan.tpl" if len(all_plans) > 1 else f"{all_plans[0].get('callsign','plan')}.tpl"
	)

	response: dict = {
		"tpl": tpl,
		"filename": filename,
		"plans": all_plans,
		"is_mtcd": is_mtcd,
	}
	if conflict_point is not None:
		response["conflict_point"] = conflict_point

	return JSONResponse(response)


@app.get("/health")
def health():
	return {"status": "ok"}
