"""Download the SRM KTR campus walking network from OpenStreetMap (Overpass)
and save it as backend/data/campus_paths.json for the in-process router.

Run again whenever campus paths change in OSM:
    python scripts/build_campus_graph.py
"""
import json
import os
from datetime import date

import requests

# Campus box + ~100m so paths hugging the boundary are kept.
BBOX = (12.8180, 80.0362, 12.8290, 80.0526)
# Public highway outside the campus wall; never part of a campus walk.
EXCLUDED = {"motorway", "motorway_link", "trunk", "trunk_link", "primary", "primary_link"}
OUT = os.path.join(os.path.dirname(__file__), "..", "data", "campus_paths.json")


def main():
    query = f'[out:json][timeout:60];way["highway"]({",".join(map(str, BBOX))});(._;>;);out body;'
    resp = requests.post(
        "https://overpass-api.de/api/interpreter",
        data={"data": query},
        headers={"User-Agent": "UrbanHeat-SRM-Campus/1.0", "Accept": "application/json"},
        timeout=90,
    )
    resp.raise_for_status()
    elements = resp.json()["elements"]

    ways = [
        {"name": e["tags"].get("name", ""), "highway": e["tags"]["highway"], "nodes": e["nodes"]}
        for e in elements
        if e["type"] == "way" and e["tags"].get("highway") not in EXCLUDED
    ]
    used = {n for w in ways for n in w["nodes"]}
    nodes = {
        str(e["id"]): [round(e["lat"], 7), round(e["lon"], 7)]
        for e in elements
        if e["type"] == "node" and e["id"] in used
    }

    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    with open(OUT, "w", encoding="utf-8") as f:
        json.dump({
            "source": "OpenStreetMap contributors (ODbL), via Overpass API",
            "fetched": date.today().isoformat(),
            "bbox": BBOX,
            "nodes": nodes,
            "ways": ways,
        }, f, separators=(",", ":"))
    print(f"Saved {len(ways)} ways / {len(nodes)} nodes to {os.path.abspath(OUT)}")


if __name__ == "__main__":
    main()
