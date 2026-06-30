from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, PlainTextResponse
import os
import json
import re

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
	"london": "EGLL",
	"berlin": "EDDT",
	"rome": "LIRF",
	"madrid": "LEMD",
	"amsterdam": "EHAM",
	"brussels": "EBBR",
	"zurich": "LSZH",
	"geneva": "LSGG",
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
	"sydney": "YSSY",
	"melbourne": "YMML",
	"johannesburg": "FAOR",
	"cape town": "FACT",
}

AVOID_REGION_CHARPOINTS = {
	"iran": ["NIBDA", "MOGOL"],
	"iraq": ["NIBDA", "MOGOL"],
	"ukraine": ["NIBDA", "MOGOL"],
}


def _to_icao_code(value: str | None) -> str | None:
	if not value:
		return value
	text = str(value).strip()
	if not text:
		return text
	upper = text.upper()
	if len(upper) == 4 and upper.isalpha():
		return upper
	key = re.sub(r"[^a-zà-ÿ]", " ", text.lower()).strip()
	key = " ".join(key.split())
	if key in ICAO_AIRPORTS:
		return ICAO_AIRPORTS[key]
	# Fallback: create a short uppercase token
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


def _extract_charpoints(prompt: str) -> list[str] | None:
	text = prompt.lower()
	charpoints_match = re.search(r"(?:charpoints?|waypoints?)\s+([a-z0-9,\s-]+)", text, re.IGNORECASE)
	if charpoints_match:
		tokens = [token.upper() for token in re.split(r"[\s,]+", charpoints_match.group(1)) if token]
		if tokens:
			return tokens

	for region, waypoints in AVOID_REGION_CHARPOINTS.items():
		avoid_pattern = re.search(rf"\b(?:avoid|bypass|detour|do not pass|cannot pass|can't pass|not over|not above|around)\b.*\b{re.escape(region)}\b", text)
		if avoid_pattern:
			return waypoints

	return None


def _fallback_parse(prompt: str) -> dict:
	"""Very small heuristic parser for prompts like:
	"Flight from Paris to Singapore at FL350"
	"""
	out = {
		"callsign": None,
		"departure": None,
		"destination": None,
		"flight_level": None,
		"aircraft_type": None,
		"route": None,
		"departure_date": None,
		"speed": None,
		"charpoints": None,
	}
	prompt = _normalize_prompt(prompt)
	text = prompt.lower()
	m = re.search(r"(?:from|between|entre)\s+([A-Za-zÀ-ÿ\s-]+?)\s+(?:to|et|and|vers)\s+([A-Za-zÀ-ÿ\s-]+?)(?=\s*(?:at|fl|$))", text, re.IGNORECASE)
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

	charpoints = _extract_charpoints(prompt)
	if charpoints:
		out["charpoints"] = charpoints

	# simple defaults
	if not out["callsign"]:
		out["callsign"] = "A1001"
	if not out["departure"]:
		out["departure"] = "UNKNOWN"
	if not out["destination"]:
		out["destination"] = "UNKNOWN"

	return out


def _llm_parse(prompt: str) -> dict:
	api_key = os.getenv("OPENAI_API_KEY")
	if not api_key or openai is None:
		raise RuntimeError("OpenAI not available")
	openai.api_key = api_key
	system = (
		"You are a parser that converts a single-line natural language flight request into a JSON object "
		"with fields: callsign, departure, destination, flight_level, aircraft_type, route, departure_date, speed, charpoints. "
		"If the request mentions avoiding a region or making a detour, include a charpoints array with suitable waypoints. "
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
		# Ensure it is JSON
		return json.loads(text)
	except Exception as e:
		raise RuntimeError(f"LLM parse failed: {e}")


@app.post("/generate-tpl")
async def generate_tpl_endpoint(body: PromptIn):
	prompt = _normalize_prompt(body.prompt)
	plans = []
	for prompt_line in _split_prompts(prompt):
		plan = _parse_prompt_line(prompt_line)
		plan = _normalize_plan(plan)
		plans.append(plan)

	# minimal validation
	try:
		validate_plan(plans)
	except Exception as e:
		raise HTTPException(status_code=400, detail=str(e))

	tpl = generate_tpl(plans)
	filename = (
		"multi-plan.tpl" if len(plans) > 1 else f"{plans[0].get('callsign','plan')}.tpl"
	)

	return JSONResponse({
		"tpl": tpl,
		"filename": filename,
		"plans": plans,
	})


@app.get("/health")
def health():
	return {"status": "ok"}
