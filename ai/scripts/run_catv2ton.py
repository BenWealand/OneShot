from __future__ import annotations

import argparse
import os
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
DEFAULT_REPO = ROOT / "ai" / "vendor" / "CatV2TON"


def _load_repo(repo: Path):
    if not repo.exists():
        raise RuntimeError(f"CatV2TON repo not found: {repo}")
    sys.path.insert(0, str(repo))
    try:
        import torch
        import diffusers
        import transformers
    except Exception as exc:
        raise RuntimeError(
            "CatV2TON dependencies are not installed in this interpreter. "
            "Use a dedicated environment, inspect ai/vendor/CatV2TON, and install the project requirements manually."
        ) from exc
    return torch, diffusers, transformers


def main() -> int:
    parser = argparse.ArgumentParser(description="FitShelf CatV2TON adapter.")
    parser.add_argument("--person")
    parser.add_argument("--garment")
    parser.add_argument("--category", choices=["upper", "lower", "dress"])
    parser.add_argument("--out")
    parser.add_argument("--repo", default=os.environ.get("CATV2TON_REPO", str(DEFAULT_REPO)))
    parser.add_argument("--check", action="store_true", help="Validate repo/dependency visibility only.")
    args = parser.parse_args()

    repo = Path(args.repo)
    torch, diffusers, transformers = _load_repo(repo)
    if args.check:
        print(f"repo={repo}")
        print(f"torch={torch.__version__}")
        print(f"diffusers={diffusers.__version__}")
        print(f"transformers={transformers.__version__}")
        print(f"cuda_available={torch.cuda.is_available()}")
        return 0

    raise RuntimeError(
        "Direct single-image CatV2TON inference is not wired yet. The official script expects VITONHD/DressCode "
        "dataset layout plus generated densepose/mask conditions. Keep FITSHELF_TRYON_BACKEND=catvton until "
        "ai/CATV2TON.md blockers are resolved."
    )


if __name__ == "__main__":
    raise SystemExit(main())
