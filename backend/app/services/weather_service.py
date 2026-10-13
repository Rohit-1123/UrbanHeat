"""Current weather from Open-Meteo, cached per ~10 km cell so every request doesn't hit it.
 Returns None when disabled (LIVE_WEATHER=0, e.g. in tests) or when
Open-Meteo is unreachable; callers then fall back to the seeded dataset.
"""
import os
import threading
import time
from datetime import datetime
from typing import Optional

import requests

CACHE_SECONDS = 600

_cache: dict = {}
_lock = threading.Lock()


def current_weather(lat: float = 13.0827, lon: float = 80.2707) -> Optional[dict]:
    if os.getenv("LIVE_WEATHER", "1") == "0":
        return None
    key = (round(lat, 1), round(lon, 1))
    with _lock:
        hit = _cache.get(key)
        if hit and time.monotonic() - hit[0] < CACHE_SECONDS:
            return hit[1]
        try:
            resp = requests.get(
                "https://api.open-meteo.com/v1/forecast",
                params={
                    "latitude": lat,
                    "longitude": lon,
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
        _cache[key] = (time.monotonic(), data)
        return data
