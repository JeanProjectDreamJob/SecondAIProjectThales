from typing import Dict, List, Union


def _safe_get(d: Dict, key: str, default: str = "-") -> str:
    v = d.get(key)
    return str(v) if v is not None else default


def _plan_lines(plan: Dict) -> List[str]:
    callsign = _safe_get(plan, "callsign")
    dep = _safe_get(plan, "departure")
    dest = _safe_get(plan, "destination")
    dep_date = _safe_get(plan, "departure_date")
    flight_level = _safe_get(plan, "flight_level")
    aircraft = _safe_get(plan, "aircraft_type")
    route = _safe_get(plan, "route", "NIL")
    speed = _safe_get(plan, "speed", "N/A")
    # Produce a numbered ICAO-like flight plan block following common field ordering
    # Field numbers follow the ICAO flight plan form for clarity (7,8,9,10,13,15,16,18)
    lines: List[str] = []
    lines.append(f"7: {callsign}")
    # 8: flight rules / type of flight (default to I / -)
    fr = _safe_get(plan, "flight_rules", "I")
    ftype = _safe_get(plan, "flight_type", "-")
    lines.append(f"8: {fr} {ftype}")
    # 9: number/type/wake (we only know aircraft type)
    lines.append(f"9: -/{aircraft}")
    # 10: equipment (use supplied or default to S/C)
    equip = _safe_get(plan, "equipment", "S")
    lines.append(f"10: {equip}")
    # 13: departure aerodrome and time
    dep_time = _safe_get(plan, "departure_time", dep_date)
    lines.append(f"13: {dep}/{dep_time}")
    # 15: speed, flight level and route
    lines.append(f"15: {speed} {flight_level} {route}")
    # 16: destination and estimated elapsed time
    eet = _safe_get(plan, "eet", "-")
    lines.append(f"16: {dest}/{eet}")
    # 18: other information (free text)
    other = _safe_get(plan, "other", "-")
    lines.append(f"18: {other}")
    lines.append("")
    lines.append("--END--")
    return lines


def generate_tpl(plan: Union[Dict, List[Dict]]) -> str:
    """Generate a simple EUROCONTROL-like TPL content from one or more structured plans.

    The output follows a compact, line-based representation containing
    required flight identifiers. This generator focuses on structure and
    validation for MVP; further EUROCONTROL-specific rules can be added.
    """
    if isinstance(plan, list):
        lines = ["TPL-FILE: EUROCONTROL-MVP"]
        for item in plan:
            lines.extend(_plan_lines(item))
            lines.append("")
        return "\n".join(lines).strip()

    lines = ["TPL-FILE: EUROCONTROL-MVP"]
    lines.extend(_plan_lines(plan))
    return "\n".join(lines)


def validate_plan(plan: Union[Dict, List[Dict]]) -> None:
    if isinstance(plan, list):
        if not plan:
            raise ValueError("Missing required fields: callsign, departure, destination")
        for item in plan:
            validate_plan(item)
        return

    required = ["callsign", "departure", "destination"]
    missing = [f for f in required if not plan.get(f)]
    if missing:
        raise ValueError(f"Missing required fields: {', '.join(missing)}")
