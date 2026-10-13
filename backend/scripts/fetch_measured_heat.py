"""Build data/measured_points.json from real measurements (no API keys needed).

Per 1 km cell (3x3 grid, ~3.3 km spacing, around each area in data/areas.json):
  vegetation_index  Landsat 8/9 NDVI, clearest hot-season scene (30 m)
  surface_temp_c    Landsat 8/9 thermal band 10 land-surface temperature (~10:30 local pass)
  building_density  ESA WorldCover 2021 built-up fraction (10 m)
  shade_score       ESA WorldCover 2021 tree-cover fraction (10 m)
Per area (Open-Meteo archive/forecast, ERA5-based ~10 km grid):
  temperature       mean 12:00-15:59 air temp, Mar-May of SEASON_YEAR
  humidity          same hours
  uv_index          mean daily UV max over the last 92 days
Satellite stats come from the Microsoft Planetary Computer data API.
Run:  python scripts/fetch_measured_heat.py   (about 10 min; needs internet)
"""
import json
import os
import statistics
from concurrent.futures import ThreadPoolExecutor
from datetime import date

import requests

HERE = os.path.dirname(__file__)
AREAS = os.path.join(HERE, "..", "data", "areas.json")
OUT = os.path.join(HERE, "..", "data", "measured_points.json")
SEASON_YEAR = date.today().year if date.today().month > 5 else date.today().year - 1
PC = "https://planetarycomputer.microsoft.com/api"
STEP, HALF = 0.03, 0.0045  # grid spacing and half cell size, degrees (~3.3 km / ~1 km cell)
session = requests.Session()
session.headers["User-Agent"] = "UrbanHeat-TN/1.0"


def get_json(method, url, **kw):
    for attempt in range(4):
        try:
            r = session.request(method, url, timeout=90, **kw)
            r.raise_for_status()
            return r.json()
        except requests.RequestException:
            if attempt == 3:
                raise


def landsat_scene(lat, lon):
    items = get_json("POST", f"{PC}/stac/v1/search", json={
        "collections": ["landsat-c2-l2"], "intersects": {"type": "Point", "coordinates": [lon, lat]},
        "datetime": f"{SEASON_YEAR}-02-01/{SEASON_YEAR}-05-31",
        "query": {"eo:cloud_cover": {"lt": 15}, "platform": {"in": ["landsat-8", "landsat-9"]}},
        "sortby": [{"field": "properties.eo:cloud_cover", "direction": "asc"}], "limit": 10,
    })["features"]
    # Whole 3x3 cell block (+ margin) must lie inside the scene.
    ok = [i for i in items if i["bbox"][0] < lon - 0.07 and i["bbox"][2] > lon + 0.07 and i["bbox"][1] < lat - 0.07 and i["bbox"][3] > lat + 0.07]
    if not ok:
        raise RuntimeError(f"no clear Landsat scene covers {lat},{lon}")
    return ok[0]["id"], ok[0]["properties"]["datetime"][:10], ok[0]["properties"]["eo:cloud_cover"]


def stats(collection, item, assets, expressions, lat, lon):
    poly = {"type": "Feature", "properties": {}, "geometry": {"type": "Polygon", "coordinates": [[
        [lon - HALF, lat - HALF], [lon + HALF, lat - HALF], [lon + HALF, lat + HALF], [lon - HALF, lat + HALF], [lon - HALF, lat - HALF]]]}}
    res = get_json("POST", f"{PC}/data/v1/item/statistics", json=poly, params={
        "collection": collection, "item": item, "assets": assets, "asset_as_band": "true", "expression": ";".join(expressions)})
    return [v["mean"] for v in res["properties"]["statistics"].values()]


def worldcover_tile(lat, lon):
    la, lo = int(lat // 3 * 3), int(lon // 3 * 3)
    return f"ESA_WorldCover_10m_2021_v200_{'N' if la >= 0 else 'S'}{abs(la):02d}{'E' if lo >= 0 else 'W'}{abs(lo):03d}"


def area_weather(lat, lon):
    arch = get_json("GET", "https://archive-api.open-meteo.com/v1/archive", params={
        "latitude": lat, "longitude": lon, "start_date": f"{SEASON_YEAR}-03-01", "end_date": f"{SEASON_YEAR}-05-31",
        "hourly": "temperature_2m,relative_humidity_2m", "timezone": "Asia/Kolkata"})["hourly"]
    afternoon = [i for i, t in enumerate(arch["time"]) if 12 <= int(t[11:13]) < 16 and arch["temperature_2m"][i] is not None]
    uv = get_json("GET", "https://api.open-meteo.com/v1/forecast", params={
        "latitude": lat, "longitude": lon, "past_days": 92, "forecast_days": 1, "daily": "uv_index_max", "timezone": "Asia/Kolkata"})["daily"]["uv_index_max"]
    return (statistics.fmean(arch["temperature_2m"][i] for i in afternoon),
            statistics.fmean(arch["relative_humidity_2m"][i] for i in afternoon),
            statistics.fmean(v for v in uv if v is not None))


def measure_area(area):
    scene, scene_date, cloud = landsat_scene(area["lat"], area["lon"])
    temp, hum, uv = area_weather(area["lat"], area["lon"])
    points = []
    for dy in (-1, 0, 1):
        for dx in (-1, 0, 1):
            lat, lon = round(area["lat"] + dy * STEP, 6), round(area["lon"] + dx * STEP, 6)
            ndvi, lst_k = stats("landsat-c2-l2", scene, "red,nir08,lwir11",
                                ["(nir08-red)*0.0000275/((nir08+red)*0.0000275-0.4)", "lwir11*0.00341802+149.0"], lat, lon)
            built, tree = stats("esa-worldcover", worldcover_tile(lat, lon), "map", ["where(map==50,1,0)", "where(map==10,1,0)"], lat, lon)
            points.append({
                "area": area["name"], "latitude": lat, "longitude": lon,
                "temperature": round(temp, 1), "humidity": round(hum, 1), "uv_index": round(uv, 1),
                "vegetation_index": round(min(max(ndvi, 0.0), 1.0), 3), "building_density": round(built, 3),
                "shade_score": round(tree, 3), "surface_temp_c": round(lst_k - 273.15, 1),
                "landsat_scene": scene, "landsat_date": scene_date, "landsat_cloud_pct": cloud,
            })
    print(f"{area['name']}: {len(points)} cells, scene {scene_date}", flush=True)
    return points


def main():
    with open(AREAS, encoding="utf-8") as f:
        areas = json.load(f)
    with ThreadPoolExecutor(max_workers=6) as pool:
        points = [p for chunk in pool.map(measure_area, areas) for p in chunk]
    with open(OUT, "w", encoding="utf-8") as f:
        json.dump({"fetched": date.today().isoformat(), "season": SEASON_YEAR, "points": points}, f, separators=(",", ":"))
    print(f"Saved {len(points)} measured cells to {os.path.abspath(OUT)}")


if __name__ == "__main__":
    main()
