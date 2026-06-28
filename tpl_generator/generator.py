from typing import Dict


def _safe_get(d: Dict, key: str, default: str = "-") -> str:
    v = d.get(key)
    return str(v) if v is not None else default


def generate_tpl(plan: Dict) -> str:
    """Generate a simple EUROCONTROL-like TPL content from a structured plan.

    The output follows a compact, line-based representation containing
    required flight identifiers. This generator focuses on structure and
    validation for MVP; further EUROCONTROL-specific rules can be added.
    """
    callsign = _safe_get(plan, "callsign")
    dep = _safe_get(plan, "departure")
    dest = _safe_get(plan, "destination")
    dep_date = _safe_get(plan, "departure_date")
    flight_level = _safe_get(plan, "flight_level")
    aircraft = _safe_get(plan, "aircraft_type")
    route = _safe_get(plan, "route", "NIL")
    speed = _safe_get(plan, "speed", "N/A")

    lines = []
    lines.append("TPL-FILE: EUROCONTROL-MVP")
    lines.append(f"ACID: {callsign}")
    lines.append(f"ADEP: {dep}")
    lines.append(f"ADES: {dest}")
    lines.append(f"DEP: {dep}")
    lines.append(f"DEST: {dest}")
    lines.append(f"DEP_DATE: {dep_date}")
    lines.append(f"FLT_LEVEL: {flight_level}")
    lines.append(f"AC_TYPE: {aircraft}")
    lines.append(f"SPEED: {speed}")
    lines.append("ROUTE:")
    lines.append(route)
    lines.append("")
    lines.append("--END--")
    return "\n".join(lines)


def validate_plan(plan: Dict) -> None:
    required = ["callsign", "departure", "destination"]
    missing = [f for f in required if not plan.get(f)]
    if missing:
        raise ValueError(f"Missing required fields: {', '.join(missing)}")
