from __future__ import annotations

import argparse
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from ai.backend.queue import enqueue_tryon


def main() -> int:
    parser = argparse.ArgumentParser(description="Run a single FitShelf queued try-on job.")
    parser.add_argument("--person", required=True)
    parser.add_argument("--garment", required=True)
    parser.add_argument("--category", required=True, choices=["upper", "lower", "dress"])
    parser.add_argument("--out", required=True)
    args = parser.parse_args()

    record = enqueue_tryon(Path(args.person), Path(args.garment), args.category, Path(args.out))
    print(record)
    return 0 if record.status == "completed" else 1


if __name__ == "__main__":
    raise SystemExit(main())
