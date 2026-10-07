"""Current campus weather from Open-Meteo, cached so every request doesn't hit it.

The campus is ~1.5 km across, so one reading at the centre stands in for all
of it. Returns None when disabled (LIVE_WEATHER=0, e.g. in tests) or when
Open-Meteo is unreachable; callers then fall back to the seeded dataset.
"""
import os
import threading
import time
from datetime import datetime
from typing import Optional

import requests

CAMPUS_CENTER = (12.8237, 80.0444)
CACHE_SECONDS = 600

_cache: dict = {"at": 0.0, "data": None}
_lock = threading.Lock()


def current_weather() -> Optional[dict]:
    if os.getenv("LIVE_WEATHER", "1") == "0":
        return None
    with _lock:
        if time.monotonic() - _cache["at"] < CACHE_SECONDS:
            return _cache["data"]
        try:
            resp = requests.get(
                "https://api.open-meteo.com/v1/forecast",
                params={
                    "latitude": CAMPUS_CENTER[0],
                    "longitude": CAMPUS_CENTER[1],
                    "current": "temperature_2m,relative_humidity_2m,uv_index",
                    "timezone": "Asia/Kolkata",
                },
                timeout=4,
            )
            resp.raise_for_status()
            cur = resp.json()["current"]
            data = {
                "temperature": float(cur["temperature_2m"]),
                "humidity": float(cur["relative_humidity_2m"]),
                "uv_index": float(cur.get("uv_index") or 0.0),
                "observed_at": cur.get("time") or datetime.now().isoformat(timespec="minutes"),
            }
        except (requests.RequestException, KeyError, TypeError, ValueError):
            data = None
        # Failures are cached for the same TTL so an outage doesn't add 4s to every request.
        _cache.update(at=time.monotonic(), data=data)
        return data
