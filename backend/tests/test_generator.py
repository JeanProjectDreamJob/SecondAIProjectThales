from tpl_generator import generate_tpl, validate_plan


def test_generate_tpl_basic():
    plan = {
        "callsign": "TEST123",
        "departure": "LOWW",
        "destination": "LFMN",
        "departure_date": "2026-06-28",
        "flight_level": "FL350",
        "aircraft_type": "B738",
        "route": "DCT",
        "cruise_speed": "0448",
        "operator": "AF"
    }
    tpl = generate_tpl(plan)
    assert tpl.splitlines()[0] == "AF"
    assert "FPL-LOWW" in tpl
    assert "TEST123" in tpl
    assert "DOF/2026-06-28" in tpl


def test_validate_plan_missing():
    plan = {"departure": "A", "destination": None}
    try:
        validate_plan(plan)
        assert False, "Expected ValueError"
    except ValueError as e:
        assert "Missing required fields" in str(e)


def test_fallback_parse_between_cities():
    from backend.main import _fallback_parse, _normalize_plan

    plan = _fallback_parse("entre Vienne et Paris")
    plan = _normalize_plan(plan)

    assert plan["departure"] == "LOWW"
    assert plan["destination"] == "LFPG"


def test_empty_prompt_uses_default_sample():
    from backend.main import _fallback_parse, _normalize_plan

    plan = _fallback_parse("   ")
    plan = _normalize_plan(plan)

    assert plan["departure"] == "LOWW"
    assert plan["destination"] == "LFPG"


def test_generate_tpl_multiple_plans():
    plans = [
        {
            "callsign": "TESTA",
            "departure": "LOWW",
            "destination": "LFPG",
            "departure_date": "-",
            "flight_level": "FL350",
            "aircraft_type": None,
            "route": None,
            "speed": None,
        },
        {
            "callsign": "TESTB",
            "departure": "WSSS",
            "destination": "LFMN",
            "departure_date": "-",
            "flight_level": "FL360",
            "aircraft_type": None,
            "route": None,
            "speed": None,
        },
    ]
    tpl = generate_tpl(plans)

    assert tpl.count("FPL-") == 2
    assert "FPL-LOWW" in tpl
    assert "FPL-WSSS" in tpl
    # two DOF lines present (one per plan)
    assert tpl.count("DOF/") == 2
