# CatV2TON Notes

Research date: 2026-05-11

Primary sources:
- Official GitHub: https://github.com/Zheng-Chong/CatV2TON
- Official Hugging Face weights: https://huggingface.co/zhengchong/CatV2TON
- Paper: https://arxiv.org/abs/2501.11325

## Summary

CatV2TON is a DiT-based vision virtual try-on model that supports image and
video try-on. The official repository describes it as a lightweight model for
V2TON with temporal concatenation. The repository update log says 256 and 512
model weights plus inference scripts were released on 2025-02-24.

## Repository Status

The official repository has been cloned to:

```text
ai/vendor/CatV2TON
```

The repo includes:
- `eval_image_try_on.py`
- `eval_video_try_on.py`
- `eval_image_metrics.py`
- `eval_video_metrics.py`
- vendored `densepose`, `detectron2`, `easyanimate`, and `modules` packages

No simple single-image CLI matching FitShelf's current `person + garment -> out`
contract is provided. The official image script expects VITONHD or DressCode
dataset layout and generated condition assets.

## Official Image Inference Shape

The README image inference command is:

```bash
CUDA_VISIBLE_DEVICES=0 python eval_image_try_on.py \
  --dataset vitonhd | dresscode \
  --data_root_path YOUR_DATASET_PATH \
  --output_dir OUTPUT_DIR_TO_SAVE_RESULTS \
  --dataloader_num_workers 8 \
  --batch_size 8 \
  --seed 42 \
  --mixed_precision bf16 \
  --allow_tf32 \
  --repaint \
  --eval_pair
```

The cloned script currently uses `--dataset_name` rather than README's
`--dataset`, and internally loads:
- base model default: `alibaba-pai/EasyAnimateV4-XL-2-InP`
- CatV2TON checkpoint default: `zhengchong/CatV2TON`, then `512-64K`
- CatVTON checkpoint default: `zhengchong/CatVTON` for DensePose/SCHP helpers

## Requirements And Risk

The repository does not include a top-level `requirements.txt`. It vendors large
subsystems and imports CUDA/Torch, OpenCV, Diffusers, Transformers, DensePose,
and EasyAnimate components. Practical integration likely requires:
- NVIDIA CUDA
- a dedicated Python environment, likely Python 3.9/3.10
- compatible PyTorch/CUDA wheels
- Diffusers, Transformers, Hugging Face Hub, OpenCV, TQDM, and Detectron2-style
  DensePose dependencies
- downloaded CatV2TON, EasyAnimate, and CatVTON/DensePose weights

The README does not state VRAM requirements. Because it builds on
EasyAnimateV4-XL-2-InP and defaults to batch size 8, expected VRAM is likely
substantially higher than the existing CatVTON path. Use a low batch size and
512-or-smaller settings for any future smoke test.

## License

The README badge states CC BY-NC-SA 4.0. Treat this as non-commercial/share-alike
until the upstream license file is verified manually.

## FitShelf Integration State

Added but disabled by default:

```dotenv
FITSHELF_TRYON_BACKEND=catvton
FITSHELF_CATV2TON_COMMAND=
FITSHELF_CATV2TON_TIMEOUT_SECONDS=1200
```

The backend health response now includes `model_backends` with CatVTON/CatV2TON
configuration status.

Adapter stub:

```text
ai/scripts/run_catv2ton.py
```

The adapter supports `--check` for dependency visibility. Full inference is
intentionally blocked until a safe single-image wrapper is built around the
official dataset-style inference path.

## Blockers Before Enabling

1. Create a dedicated `ai/.venv-catv2ton` with known-good Torch/CUDA versions.
2. Resolve missing top-level dependency list from upstream imports.
3. Build a temporary VITONHD-style dataset folder from FitShelf's person and
   garment images.
4. Generate or adapt DensePose/mask condition assets for single-image input.
5. Run a local single-image smoke test with batch size 1.
6. Confirm license compatibility for the intended use.

Until those blockers are resolved, keep CatVTON as the production backend.
