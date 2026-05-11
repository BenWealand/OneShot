from __future__ import annotations

import argparse
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from fitshelf_tryon import run_tryon


def main() -> int:
    parser = argparse.ArgumentParser(description="Run the FitShelf local try-on pipeline.")
    parser.add_argument("--person", required=True, help="Path to the person image.")
    parser.add_argument("--garment", required=True, help="Path to the garment image.")
    parser.add_argument("--category", required=True, choices=["upper", "lower", "dress"])
    parser.add_argument("--out", required=True, help="Output image path.")
    parser.add_argument("--debug-dir", default="ai/outputs/debug", help="Directory for debug artifacts.")
    args = parser.parse_args()

    result = run_tryon(
        person=args.person,
        garment=args.garment,
        category=args.category,
        out=args.out,
        debug_dir=args.debug_dir,
    )
    print(f"output={result.output_path}")
    print(f"backend={result.backend}")
    print(f"metadata={result.metadata_path}")
    print(f"debug_dir={result.debug_dir}")
    for note in result.notes:
        print(f"note={note}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
