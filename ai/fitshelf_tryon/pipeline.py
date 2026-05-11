from __future__ import annotations

import json
import os
import shlex
import subprocess
from dataclasses import asdict, dataclass
from pathlib import Path

from PIL import Image, ImageEnhance, ImageFilter

from ai.backend.config import RenderSettings, get_render_settings, get_settings

from .preprocess import VALID_CATEGORIES, preprocess_inputs


@dataclass(frozen=True)
class TryOnResult:
    output_path: Path
    backend: str
    category: str
    debug_dir: Path
    metadata_path: Path
    notes: list[str]


def _external_command(
    person: Path,
    garment: Path,
    category: str,
    out: Path,
    render_settings: RenderSettings,
    backend: str,
) -> tuple[bool, str]:
    settings = get_settings()
    command_template = (settings.catv2ton_command if backend == "catv2ton" else settings.catvton_command).strip()
    if not command_template:
        env_name = "FITSHELF_CATV2TON_COMMAND" if backend == "catv2ton" else "FITSHELF_CATVTON_COMMAND"
        return False, f"{env_name} is not configured."

    command = command_template.format(
        person=str(person),
        garment=str(garment),
        category=category,
        out=str(out),
    )
    env = os.environ.copy()
    env.update(
        {
            "CATVTON_WIDTH": str(render_settings.width),
            "CATVTON_HEIGHT": str(render_settings.height),
            "CATVTON_STEPS": str(render_settings.steps),
            "CATVTON_MIXED_PRECISION": render_settings.precision,
        }
    )
    try:
        completed = subprocess.run(
            shlex.split(command, posix=os.name != "nt"),
            check=False,
            capture_output=True,
            text=True,
            env=env,
            timeout=settings.catv2ton_timeout_seconds if backend == "catv2ton" else settings.catvton_timeout_seconds,
        )
    except subprocess.TimeoutExpired:
        timeout = settings.catv2ton_timeout_seconds if backend == "catv2ton" else settings.catvton_timeout_seconds
        return False, f"external {backend} command timed out after {timeout} seconds"
    if completed.returncode == 0 and out.exists():
        return True, completed.stdout.strip() or f"external {backend} command completed"
    return False, (completed.stderr or completed.stdout or f"external {backend} command failed").strip()


def _placement(category: str, canvas_size: tuple[int, int]) -> tuple[int, int, int]:
    width, height = canvas_size
    if category == "upper":
        return width // 2, int(height * 0.38), int(width * 0.46)
    if category == "lower":
        return width // 2, int(height * 0.64), int(width * 0.42)
    return width // 2, int(height * 0.50), int(width * 0.52)


def _fallback_render(person_path: Path, garment_path: Path, category: str, out: Path) -> None:
    person = Image.open(person_path).convert("RGB")
    garment = Image.open(garment_path).convert("RGBA")

    center_x, center_y, target_width = _placement(category, person.size)
    scale = target_width / garment.width
    target_height = max(1, int(garment.height * scale))
    garment = garment.resize((target_width, target_height), Image.Resampling.LANCZOS)

    alpha = garment.getchannel("A")
    if alpha.getbbox() is None:
        alpha = Image.new("L", garment.size, 220)
    alpha = alpha.filter(ImageFilter.GaussianBlur(1))
    garment.putalpha(alpha)

    garment_rgb = ImageEnhance.Contrast(garment.convert("RGB")).enhance(1.08)
    garment = Image.merge("RGBA", (*garment_rgb.split(), alpha))

    result = person.convert("RGBA")
    x = center_x - garment.width // 2
    y = center_y - garment.height // 2
    shadow = Image.new("RGBA", garment.size, (0, 0, 0, 0))
    shadow_alpha = alpha.filter(ImageFilter.GaussianBlur(9)).point(lambda px: int(px * 0.22))
    shadow.putalpha(shadow_alpha)
    result.alpha_composite(shadow, (x + 8, y + 10))
    result.alpha_composite(garment, (x, y))
    out.parent.mkdir(parents=True, exist_ok=True)
    result.convert("RGB").save(out, quality=94)


def run_tryon(
    person: str | Path,
    garment: str | Path,
    category: str,
    out: str | Path,
    debug_dir: str | Path = "ai/outputs/debug",
    render_mode: str = "preview",
) -> TryOnResult:
    if category not in VALID_CATEGORIES:
        raise ValueError(f"Unsupported category '{category}'. Use one of: {', '.join(sorted(VALID_CATEGORIES))}")

    person_path = Path(person)
    garment_path = Path(garment)
    out_path = Path(out)
    debug_path = Path(debug_dir)
    render_settings = get_render_settings(render_mode)
    preprocess = preprocess_inputs(person_path, garment_path, debug_path)

    notes = list(preprocess.notes)
    notes.append(
        f"render_mode={render_settings.render_mode}; width={render_settings.width}; height={render_settings.height}; "
        f"steps={render_settings.steps}; precision={render_settings.precision}"
    )
    settings = get_settings()
    requested_backend = settings.tryon_backend if settings.tryon_backend in {"catvton", "catv2ton"} else "catvton"
    ok, message = _external_command(person_path, garment_path, category, out_path, render_settings, requested_backend)
    if ok:
        backend = f"{requested_backend}-external"
        notes.append(f"{requested_backend} invoked with original input images; normalized images kept for debug only")
        notes.append(message)
    else:
        backend = "local-fallback"
        notes.append(f"{requested_backend} unavailable: {message}")
        _fallback_render(preprocess.person_path, preprocess.garment_path, category, out_path)

    metadata_path = out_path.with_suffix(out_path.suffix + ".json")
    metadata = {
        "output_path": str(out_path),
        "backend": backend,
        "category": category,
        "render_mode": render_settings.render_mode,
        "width": render_settings.width,
        "height": render_settings.height,
        "steps": render_settings.steps,
        "precision": render_settings.precision,
        "debug_dir": str(debug_path),
        "preprocess": {key: str(value) if isinstance(value, Path) else value for key, value in asdict(preprocess).items()},
        "notes": notes,
    }
    metadata_path.write_text(json.dumps(metadata, indent=2), encoding="utf-8")

    return TryOnResult(
        output_path=out_path,
        backend=backend,
        category=category,
        debug_dir=debug_path,
        metadata_path=metadata_path,
        notes=notes,
    )
