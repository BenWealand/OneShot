from __future__ import annotations

import argparse
from pathlib import Path

import requests


def main() -> int:
    parser = argparse.ArgumentParser(description="Submit a FitShelf try-on request to the local FastAPI backend.")
    parser.add_argument("--url", default="http://127.0.0.1:8000/tryon")
    parser.add_argument("--person", required=True)
    parser.add_argument("--garment", required=True)
    parser.add_argument("--category", default="upper", choices=["upper", "lower", "dress"])
    parser.add_argument("--out", required=True)
    args = parser.parse_args()

    with open(args.person, "rb") as person_file, open(args.garment, "rb") as garment_file:
        response = requests.post(
            args.url,
            data={"category": args.category},
            files={
                "person": (Path(args.person).name, person_file, "image/jpeg"),
                "garment": (Path(args.garment).name, garment_file, "image/jpeg"),
            },
            timeout=60,
        )
    response.raise_for_status()
    result = response.json()
    output = Path(args.out)
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_bytes(requests.get(result["result_url"], timeout=60).content)
    print(result)
    print(f"saved={output}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
