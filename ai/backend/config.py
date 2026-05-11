from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
BACKEND_DIR = Path(__file__).resolve().parent


def _parse_env_line(line: str) -> tuple[str, str] | None:
    stripped = line.strip()
    if not stripped or stripped.startswith("#") or "=" not in stripped:
        return None
    key, value = stripped.split("=", 1)
    key = key.strip()
    value = value.strip()
    if not key:
        return None
    if len(value) >= 2 and value[0] == value[-1] and value[0] in {"'", '"'}:
        value = value[1:-1]
    return key, value


def load_env_file(path: Path, *, override: bool = False, protected_keys: set[str] | None = None) -> list[str]:
    if not path.exists():
        return []

    protected_keys = protected_keys or set()
    loaded: list[str] = []
    for line in path.read_text(encoding="utf-8").splitlines():
        parsed = _parse_env_line(line)
        if not parsed:
            continue
        key, value = parsed
        if key in protected_keys:
            continue
        if override or key not in os.environ:
            os.environ[key] = value
            loaded.append(key)
    return loaded


def load_backend_env() -> None:
    if os.environ.get("FITSHELF_SKIP_ENV_FILE") == "1":
        return
    load_env_file(ROOT / ".env", override=True)
    load_env_file(BACKEND_DIR / ".env", override=True)


def _int_env(name: str, default: int) -> int:
    value = os.environ.get(name)
    if value is None or value == "":
        return default
    return int(value)


def _str_env(name: str, default: str) -> str:
    value = os.environ.get(name)
    return default if value is None or value == "" else value


@dataclass(frozen=True)
class BackendSettings:
    host: str
    port: int
    runtime_dir: Path
    catvton_width: int
    catvton_height: int
    catvton_steps: int
    catvton_mixed_precision: str
    catvton_command: str
    tryon_backend: str
    catv2ton_command: str
    catvton_timeout_seconds: int
    catv2ton_timeout_seconds: int
    supabase_url: str
    supabase_service_role_key: str
    supabase_tryon_bucket: str


@dataclass(frozen=True)
class RenderSettings:
    render_mode: str
    width: int
    height: int
    steps: int
    precision: str


RENDER_MODES = {
    "preview": RenderSettings(render_mode="preview", width=384, height=512, steps=20, precision="fp16"),
    "hd": RenderSettings(render_mode="hd", width=768, height=1024, steps=50, precision="no"),
}


def get_render_settings(render_mode: str | None) -> RenderSettings:
    mode = (render_mode or "preview").strip().lower()
    if mode not in RENDER_MODES:
        raise ValueError(f"Unsupported render mode '{render_mode}'. Use one of: {', '.join(sorted(RENDER_MODES))}")
    return RENDER_MODES[mode]


def get_settings() -> BackendSettings:
    load_backend_env()
    return BackendSettings(
        host=_str_env("FITSHELF_BACKEND_HOST", "0.0.0.0"),
        port=_int_env("FITSHELF_BACKEND_PORT", 8000),
        runtime_dir=Path(_str_env("FITSHELF_BACKEND_RUNTIME_DIR", "ai/outputs/api")),
        catvton_width=_int_env("CATVTON_WIDTH", 768),
        catvton_height=_int_env("CATVTON_HEIGHT", 1024),
        catvton_steps=_int_env("CATVTON_STEPS", 50),
        catvton_mixed_precision=_str_env("CATVTON_MIXED_PRECISION", "no"),
        catvton_command=_str_env("FITSHELF_CATVTON_COMMAND", ""),
        tryon_backend=_str_env("FITSHELF_TRYON_BACKEND", "catvton").strip().lower(),
        catv2ton_command=_str_env("FITSHELF_CATV2TON_COMMAND", ""),
        catvton_timeout_seconds=_int_env("FITSHELF_CATVTON_TIMEOUT_SECONDS", 900),
        catv2ton_timeout_seconds=_int_env("FITSHELF_CATV2TON_TIMEOUT_SECONDS", 1200),
        supabase_url=_str_env("SUPABASE_URL", ""),
        supabase_service_role_key=_str_env("SUPABASE_SERVICE_ROLE_KEY", ""),
        supabase_tryon_bucket=_str_env("SUPABASE_TRYON_BUCKET", ""),
    )
