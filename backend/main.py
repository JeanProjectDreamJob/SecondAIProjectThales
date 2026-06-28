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


def _normalize_plan(plan: dict) -> dict:
	out = dict(plan)
	out["departure"] = _to_icao_code(out.get("departure"))
	out["destination"] = _to_icao_code(out.get("destination"))
	return out


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

	# simple defaults
	if not out["callsign"]:
		out["callsign"] = f"AUTO{abs(hash(prompt)) % 10000}"
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
		# Ensure it is JSON
		return json.loads(text)
	except Exception as e:
		raise RuntimeError(f"LLM parse failed: {e}")


@app.post("/generate-tpl")
async def generate_tpl_endpoint(body: PromptIn):
	prompt = _normalize_prompt(body.prompt)
	plan = None
	# Try LLM parser first when available
	try:
		plan = _llm_parse(prompt)
	except Exception:
		plan = _fallback_parse(prompt)

	plan = _normalize_plan(plan)

	# minimal validation
	try:
		validate_plan(plan)
	except Exception as e:
		raise HTTPException(status_code=400, detail=str(e))

	tpl = generate_tpl(plan)

	return JSONResponse({
		"tpl": tpl,
		"filename": f"{plan.get('callsign','plan')}.tpl",
		"plan": plan,
	})


@app.get("/health")
def health():
	return {"status": "ok"}
