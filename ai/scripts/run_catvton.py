from __future__ import annotations

import argparse
import os
import sys
from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[2]
DEFAULT_REPO = ROOT / "ai" / "vendor" / "CatVTON"
DEFAULT_MODEL_DIR = ROOT / "ai" / "models"


def _category(value: str) -> str:
    return {"upper": "upper", "lower": "lower", "dress": "overall"}[value]


def _dtype(torch_module, value: str):
    return {
        "no": torch_module.float32,
        "fp16": torch_module.float16,
        "bf16": torch_module.bfloat16,
    }[value]


def _load_catvton(repo: Path):
    if not repo.exists():
        raise RuntimeError(f"CatVTON repo not found: {repo}")
    sys.path.insert(0, str(repo))
    try:
        import torch
        from diffusers.image_processor import VaeImageProcessor
        from huggingface_hub import snapshot_download
        from model.cloth_masker import AutoMasker
        from model.pipeline import CatVTONPipeline
        from utils import resize_and_crop, resize_and_padding
    except Exception as exc:
        raise RuntimeError(
            "CatVTON dependencies are not installed in this interpreter. "
            "Create a dedicated Python 3.9 CatVTON environment and install "
            "ai/vendor/CatVTON/requirements.txt."
        ) from exc
    return torch, VaeImageProcessor, snapshot_download, AutoMasker, CatVTONPipeline, resize_and_crop, resize_and_padding


def _snapshot_or_path(snapshot_download, value: str, model_dir: Path, name: str) -> str:
    path = Path(value)
    if "/" not in value or path.exists():
        return str(path if path.exists() else value)
    local_dir = model_dir / name
    local_dir.mkdir(parents=True, exist_ok=True)
    return snapshot_download(
        repo_id=value,
        local_dir=str(local_dir),
        local_dir_use_symlinks=False,
    )


def run_catvton(
    person: Path,
    garment: Path,
    category: str,
    out: Path,
    repo: Path,
    width: int,
    height: int,
    steps: int,
    guidance_scale: float,
    seed: int,
    mixed_precision: str,
    base_model_path: str,
    resume_path: str,
    model_dir: Path,
    device: str,
    allow_tf32: bool,
) -> None:
    (
        torch,
        VaeImageProcessor,
        snapshot_download,
        AutoMasker,
        CatVTONPipeline,
        resize_and_crop,
        resize_and_padding,
    ) = _load_catvton(repo)

    if device == "cuda" and not torch.cuda.is_available():
        raise RuntimeError("CatVTON requested CUDA, but torch.cuda.is_available() is false.")

    repo_path = _snapshot_or_path(snapshot_download, resume_path, model_dir, "CatVTON")
    base_model = _snapshot_or_path(snapshot_download, base_model_path, model_dir, "stable-diffusion-inpainting")
    weight_dtype = _dtype(torch, mixed_precision)

    pipeline = CatVTONPipeline(
        base_ckpt=base_model,
        attn_ckpt=repo_path,
        attn_ckpt_version="mix",
        weight_dtype=weight_dtype,
        use_tf32=allow_tf32,
        device=device,
        skip_safety_check=True,
    )
    mask_processor = VaeImageProcessor(
        vae_scale_factor=8,
        do_normalize=False,
        do_binarize=True,
        do_convert_grayscale=True,
    )
    automasker = AutoMasker(
        densepose_ckpt=os.path.join(str(repo_path), "DensePose"),
        schp_ckpt=os.path.join(str(repo_path), "SCHP"),
        device=device,
    )

    person_image = Image.open(person).convert("RGB")
    garment_image = Image.open(garment).convert("RGB")
    person_image = resize_and_crop(person_image, (width, height))
    garment_image = resize_and_padding(garment_image, (width, height))
    mask = automasker(person_image, _category(category))["mask"]
    mask = mask_processor.blur(mask, blur_factor=9)

    generator = None if seed < 0 else torch.Generator(device=device).manual_seed(seed)
    result = pipeline(
        image=person_image,
        condition_image=garment_image,
        mask=mask,
        num_inference_steps=steps,
        guidance_scale=guidance_scale,
        generator=generator,
        height=height,
        width=width,
    )[0]
    out.parent.mkdir(parents=True, exist_ok=True)
    result.save(out)


def main() -> int:
    parser = argparse.ArgumentParser(description="Run CatVTON for FitShelf through the official CatVTON repo.")
    parser.add_argument("--person")
    parser.add_argument("--garment")
    parser.add_argument("--category", choices=["upper", "lower", "dress"])
    parser.add_argument("--out")
    parser.add_argument("--repo", default=os.environ.get("CATVTON_REPO", str(DEFAULT_REPO)))
    parser.add_argument("--width", type=int, default=int(os.environ.get("CATVTON_WIDTH", "768")))
    parser.add_argument("--height", type=int, default=int(os.environ.get("CATVTON_HEIGHT", "1024")))
    parser.add_argument("--steps", type=int, default=int(os.environ.get("CATVTON_STEPS", "50")))
    parser.add_argument("--guidance-scale", type=float, default=float(os.environ.get("CATVTON_GUIDANCE_SCALE", "2.5")))
    parser.add_argument("--seed", type=int, default=int(os.environ.get("CATVTON_SEED", "42")))
    parser.add_argument("--mixed-precision", default=os.environ.get("CATVTON_MIXED_PRECISION", "no"), choices=["no", "fp16", "bf16"])
    parser.add_argument("--base-model-path", default=os.environ.get("CATVTON_BASE_MODEL_PATH", "booksforcharlie/stable-diffusion-inpainting"))
    parser.add_argument("--resume-path", default=os.environ.get("CATVTON_RESUME_PATH", "zhengchong/CatVTON"))
    parser.add_argument("--model-dir", default=os.environ.get("CATVTON_MODEL_DIR", str(DEFAULT_MODEL_DIR)))
    parser.add_argument("--device", default=os.environ.get("CATVTON_DEVICE", "cuda"))
    parser.add_argument("--allow-tf32", action=argparse.BooleanOptionalAction, default=os.environ.get("CATVTON_ALLOW_TF32", "1") != "0")
    parser.add_argument("--check", action="store_true", help="Only validate repository, dependencies, and CUDA visibility.")
    args = parser.parse_args()

    repo = Path(args.repo)
    if args.check:
        torch, *_ = _load_catvton(repo)
        print(f"repo={repo}")
        print(f"torch={torch.__version__}")
        print(f"cuda_available={torch.cuda.is_available()}")
        return 0
    for name in ("person", "garment", "category", "out"):
        if getattr(args, name) is None:
            parser.error(f"--{name} is required unless --check is set")

    run_catvton(
        person=Path(args.person),
        garment=Path(args.garment),
        category=args.category,
        out=Path(args.out),
        repo=repo,
        width=args.width,
        height=args.height,
        steps=args.steps,
        guidance_scale=args.guidance_scale,
        seed=args.seed,
        mixed_precision=args.mixed_precision,
        base_model_path=args.base_model_path,
        resume_path=args.resume_path,
        model_dir=Path(args.model_dir),
        device=args.device,
        allow_tf32=args.allow_tf32,
    )
    print(f"output={args.out}")
    print("backend=catvton")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
