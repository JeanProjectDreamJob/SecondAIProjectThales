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


def _format_route_segment(plan: Dict) -> str:
    route = _safe_get(plan, "route", "DCT")
    charpoints = plan.get("charpoints") or plan.get("waypoints")

    if isinstance(charpoints, (list, tuple, set)):
        tokens = [str(item).strip() for item in charpoints if str(item).strip()]
    elif charpoints is not None:
        tokens = [str(charpoints).strip()]
    else:
        tokens = ["NIBDA", "MOGOL"]

    if route and str(route).strip() not in {"-", "NIL", "None", ""}:
        tokens = [str(route).strip(), *tokens]

    return " ".join(tokens) if tokens else "DCT"


def _format_fpl_line(plan: Dict, idx: int) -> str:
    """Format a compact single-line FPL entry with defaults for missing fields.

    Example output:
    AF 001 FPL-LOWW01/TEST123-IS-B738/S-C/<now>-N0448F350 DCT NIBDA MOGOL LFML/DCT/-/-
    """
    adep = _safe_get(plan, "departure", "A1001")
    suffix = _safe_get(plan, "departure_suffix", "01")
    callsign = _safe_get(plan, "callsign", "A1001")
    fr = _safe_get(plan, "flight_rules", "I")
    ftype = _safe_get(plan, "flight_type", "S")
    aircraft = _safe_get(plan, "aircraft_type", "B738")
    equip = _safe_get(plan, "equipment", "S")
    ssr = _safe_get(plan, "ssr", "C")
    dep_time = _safe_get(plan, "departure_time", "<now>")
    cruise_speed = _safe_get(plan, "cruise_speed", "0448")
    fl = _safe_get(plan, "flight_level", "FL320").replace("FL", "")
    destination = _safe_get(plan, "destination", "A1001")
    route = _safe_get(plan, "route", "DCT")
    route_segment = _format_route_segment(plan)
    alternate = _safe_get(plan, "alternate", "-")
    remarks = _safe_get(plan, "remarks", "-")

    return (
        f"AF {idx:03d} FPL-{adep}{suffix}/{callsign}-{fr}{ftype}-{aircraft}/"
        f"{equip}-{ssr}/{dep_time}-N{cruise_speed}F{fl} {route_segment} {destination}/{route}/{alternate}/{remarks}"
    )


def generate_tpl(plan: Union[Dict, List[Dict]]) -> str:
    """Generate a compact file containing one FPL line per plan.

    The file starts with an optional operator code (from first plan `operator`)
    or defaults to `AF` on the first line, then an empty line, then one
    FPL line per plan and optional DOF lines when `departure_date` is set.
    """
    lines: List[str] = []

    if isinstance(plan, list):
        for idx, item in enumerate(plan, start=1):
            lines.append(_format_fpl_line(item, idx))
            dep_date = item.get("departure_date")
            if dep_date:
                lines.append(f"DOF/{dep_date}")
            lines.append("")
        return "\n".join(lines).strip()

    # single plan
    lines.append(_format_fpl_line(plan, 1))
    dep_date = plan.get("departure_date")
    if dep_date:
        lines.append(f"DOF/{dep_date}")
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
