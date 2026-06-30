DEFAULT_SPEED = "0450"
DEFAULT_AIRCRAFT = "B738"
DEFAULT_OPERATOR = "AF"


def validate_plan(plan):
    if isinstance(plan, list):
        for p in plan:
            validate_plan(p)
        return

    missing = []
    if not plan.get("departure"):
        missing.append("departure")
    if not plan.get("destination"):
        missing.append("destination")

    if missing:
        raise ValueError(f"Missing required fields: {', '.join(missing)}")


def _format_speed_level(speed, flight_level):
    spd = str(speed or DEFAULT_SPEED).zfill(4)
    fl_str = str(flight_level or "FL350").upper().replace("FL", "")
    return f"N{spd}F{fl_str}"


def _generate_single(plan, msg_num):
    operator = plan.get("operator") or DEFAULT_OPERATOR
    callsign = plan.get("callsign") or "UNKNWN"
    departure = plan.get("departure") or "XXXX"
    destination = plan.get("destination") or "XXXX"
    aircraft_type = plan.get("aircraft_type") or DEFAULT_AIRCRAFT
    route = plan.get("route") or "DCT"

    speed = plan.get("cruise_speed") or plan.get("speed") or DEFAULT_SPEED
    flight_level = plan.get("flight_level") or "FL350"
    speed_level = _format_speed_level(speed, flight_level)

    dep_date = plan.get("departure_date")
    if not dep_date or dep_date == "-":
        dep_date = "-"

    fpl_line = (
        f"{operator} {msg_num:03d} FPL-{departure}01/{callsign}"
        f"-IS-{aircraft_type}/S-C/<now>"
        f"-{speed_level} {route} {destination}/DCT/-/-"
    )
    dof_line = f"DOF/{dep_date}"

    return f"{fpl_line}\n{dof_line}"


def generate_tpl(plan):
    if isinstance(plan, list):
        parts = [_generate_single(p, i + 1) for i, p in enumerate(plan)]
        return "\n".join(parts)
    return _generate_single(plan, 1)
