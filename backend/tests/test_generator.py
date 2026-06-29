from tpl_generator import generate_tpl, validate_plan


def test_generate_tpl_basic():
    plan = {
        "callsign": "TEST123",
        "departure": "Paris",
        "destination": "Singapore",
        "departure_date": "2026-06-28",
        "flight_level": "FL350",
        "aircraft_type": "B738",
        "route": "DCT"
    }
    tpl = generate_tpl(plan)
    assert "7: TEST123" in tpl
    assert "13: Paris" in tpl or "13: Paris/" in tpl
    assert "16: Singapore" in tpl or "16: Singapore/" in tpl


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

    assert tpl.count("7:") == 2
    assert "13: LOWW" in tpl or "13: LOWW/" in tpl
    assert "16: LFPG" in tpl or "16: LFPG/" in tpl
    assert "13: WSSS" in tpl or "13: WSSS/" in tpl
    assert "16: LFMN" in tpl or "16: LFMN/" in tpl
