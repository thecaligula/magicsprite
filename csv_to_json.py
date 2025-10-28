#!/usr/bin/env python3
"""
Simple CSV -> JSON converter for `codes.csv`.

Usage:
  python csv_to_json.py                 # reads ./codes.csv and writes ./codes.json
  python csv_to_json.py -i input.csv -o out.json
  python csv_to_json.py --map-by name   # output JSON object keyed by Color Name
  python csv_to_json.py --map-by hard   # output JSON object keyed by Hard

Fields R, G, B are converted to integers when possible.
"""
import csv
import json
import argparse
import sys
from pathlib import Path


def parse_row(row):
    # Trim keys/values and convert R/G/B to ints when possible
    parsed = {}
    for k, v in row.items():
        key = k.strip()
        val = v.strip() if isinstance(v, str) else v
        if key in ("R", "G", "B"):
            try:
                parsed[key] = int(val) if val != "" else None
            except Exception:
                parsed[key] = None
        else:
            parsed[key] = val
    return parsed


def load_csv(path: Path):
    with path.open("r", encoding="utf-8", newline="") as f:
        reader = csv.DictReader(f)
        rows = [parse_row(r) for r in reader]
    return rows


def write_json(data, path: Path, pretty: bool = True):
    with path.open("w", encoding="utf-8") as f:
        if pretty:
            json.dump(data, f, ensure_ascii=False, indent=2)
        else:
            json.dump(data, f, ensure_ascii=False, separators=(",", ":"))


def build_map(rows, key_field: str):
    mapping = {}
    for r in rows:
        key = r.get(key_field)
        if key is None or key == "":
            # skip entries without the chosen key
            continue
        if key in mapping:
            # if duplicate key, convert value into a list
            if isinstance(mapping[key], list):
                mapping[key].append(r)
            else:
                mapping[key] = [mapping[key], r]
        else:
            mapping[key] = r
    return mapping


def main(argv=None):
    p = argparse.ArgumentParser(description="Convert a CSV of color codes to JSON.")
    p.add_argument("-i", "--input", default="codes.csv", help="Input CSV path (default: codes.csv)")
    p.add_argument("-o", "--output", default="codes.json", help="Output JSON path (default: codes.json)")
    p.add_argument("--no-pretty", dest="pretty", action="store_false", help="Write compact JSON without indentation")
    p.add_argument("--map-by", choices=["name", "hard"], help="Output a mapping keyed by 'Color Name' (name) or 'Hard' (hard) instead of a list")
    args = p.parse_args(argv)

    in_path = Path(args.input)
    out_path = Path(args.output)

    if not in_path.exists():
        print(f"Input file not found: {in_path}", file=sys.stderr)
        sys.exit(2)

    rows = load_csv(in_path)

    if args.map_by:
        key_field = "Color Name" if args.map_by == "name" else "Hard"
        data = build_map(rows, key_field)
    else:
        data = rows

    write_json(data, out_path, pretty=args.pretty)
    print(f"Wrote {len(rows)} records to {out_path} (map_by={args.map_by})")


if __name__ == "__main__":
    main()
