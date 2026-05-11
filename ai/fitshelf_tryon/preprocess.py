from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Optional

from PIL import Image, ImageChops, ImageOps


VALID_CATEGORIES = {"upper", "lower", "dress"}


@dataclass(frozen=True)
class PreprocessResult:
    person_path: Path
    garment_path: Path
    garment_mask_path: Path
    pose_debug_path: Path
    notes: list[str]


def ensure_rgb_image(path: Path) -> Image.Image:
    if not path.exists():
        raise FileNotFoundError(f"Image not found: {path}")
    return Image.open(path).convert("RGB")


def normalize_person(person: Image.Image, max_side: int = 1024) -> Image.Image:
    image = ImageOps.exif_transpose(person)
    image.thumbnail((max_side, max_side), Image.Resampling.LANCZOS)
    canvas = Image.new("RGB", (max_side, max_side), (245, 245, 242))
    offset = ((max_side - image.width) // 2, (max_side - image.height) // 2)
    canvas.paste(image, offset)
    return canvas


def normalize_garment(garment: Image.Image, max_side: int = 768) -> Image.Image:
    image = ImageOps.exif_transpose(garment)
    image.thumbnail((max_side, max_side), Image.Resampling.LANCZOS)
    return image


def make_garment_mask(garment: Image.Image) -> Image.Image:
    bg = Image.new("RGB", garment.size, garment.getpixel((0, 0)))
    diff = ImageChops.difference(garment, bg).convert("L")
    return diff.point(lambda px: 255 if px > 18 else 0)


def make_pose_debug(person: Image.Image) -> Image.Image:
    debug = person.copy()
    w, h = debug.size
    pixels = debug.load()
    guide_color = (58, 96, 132)
    for x in range(w // 2 - 1, w // 2 + 2):
        for y in range(h // 8, h * 7 // 8):
            pixels[x, y] = guide_color
    for y in (h // 3, h // 2, h * 2 // 3):
        for x in range(w // 4, w * 3 // 4):
            pixels[x, y] = guide_color
    return debug


def preprocess_inputs(
    person_path: Path,
    garment_path: Path,
    debug_dir: Optional[Path] = None,
) -> PreprocessResult:
    debug_dir = debug_dir or Path("ai/outputs/debug")
    debug_dir.mkdir(parents=True, exist_ok=True)

    person = normalize_person(ensure_rgb_image(person_path))
    garment = normalize_garment(ensure_rgb_image(garment_path))
    mask = make_garment_mask(garment)
    pose_debug = make_pose_debug(person)

    normalized_person_path = debug_dir / "person_normalized.jpg"
    normalized_garment_path = debug_dir / "garment_normalized.png"
    garment_mask_path = debug_dir / "garment_mask.png"
    pose_debug_path = debug_dir / "pose_debug.jpg"

    person.save(normalized_person_path, quality=92)
    garment.save(normalized_garment_path)
    mask.save(garment_mask_path)
    pose_debug.save(pose_debug_path, quality=92)

    return PreprocessResult(
        person_path=normalized_person_path,
        garment_path=normalized_garment_path,
        garment_mask_path=garment_mask_path,
        pose_debug_path=pose_debug_path,
        notes=[
            "person normalized to 1024 square canvas",
            "garment normalized with background-difference mask placeholder",
            "pose validation placeholder emitted as guide overlay",
        ],
    )
