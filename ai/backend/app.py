from __future__ import annotations

from pathlib import Path
from urllib.parse import quote

from fastapi import FastAPI, File, Form, HTTPException, Request, UploadFile
from fastapi.responses import FileResponse, Response

from ai.backend.config import RENDER_MODES, get_render_settings, get_settings
from ai.backend.queue import create_job, get_job, run_job
from ai.backend.supabase_store import check_supabase_database, check_supabase_schema, check_supabase_storage, create_signed_url, download_object
from ai.fitshelf_tryon.preprocess import VALID_CATEGORIES
from ai.scripts.extract_product_image import extract_product_images

app = FastAPI(title="FitShelf Try-On API", version="0.1.0")

SETTINGS = get_settings()
RUNTIME_DIR = SETTINGS.runtime_dir
RUNTIME_DIR.mkdir(parents=True, exist_ok=True)
MAX_UPLOAD_BYTES = 15 * 1024 * 1024
ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp"}


def _save_upload(upload: UploadFile, path: Path) -> None:
    if upload.content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(status_code=400, detail=f"Unsupported image type: {upload.content_type}")
    size = 0
    with path.open("wb") as handle:
        while chunk := upload.file.read(1024 * 1024):
            size += len(chunk)
            if size > MAX_UPLOAD_BYTES:
                raise HTTPException(status_code=413, detail="Image upload exceeds 15 MB limit")
            handle.write(chunk)


@app.get("/health")
def health() -> dict[str, object]:
    return {
        "status": "ok",
        "runtime_dir": str(RUNTIME_DIR),
        "catvton": {
            "configured": bool(SETTINGS.catvton_command),
            "width": SETTINGS.catvton_width,
            "height": SETTINGS.catvton_height,
            "steps": SETTINGS.catvton_steps,
            "mixed_precision": SETTINGS.catvton_mixed_precision,
        },
        "model_backends": {
            "selected": SETTINGS.tryon_backend,
            "catvton": {"configured": bool(SETTINGS.catvton_command)},
            "catv2ton": {"configured": bool(SETTINGS.catv2ton_command)},
        },
        "render_modes": {
            key: {
                "width": value.width,
                "height": value.height,
                "steps": value.steps,
                "precision": value.precision,
            }
            for key, value in RENDER_MODES.items()
        },
        "supabase_storage_configured": bool(
            SETTINGS.supabase_url and SETTINGS.supabase_service_role_key and SETTINGS.supabase_tryon_bucket
        ),
    }


@app.get("/debug/config")
def debug_config() -> dict[str, object]:
    return {
        "runtime_dir": str(RUNTIME_DIR),
        "max_upload_mb": MAX_UPLOAD_BYTES // (1024 * 1024),
        "allowed_image_types": sorted(ALLOWED_IMAGE_TYPES),
        "tryon_backend": SETTINGS.tryon_backend,
        "catvton_command_configured": bool(SETTINGS.catvton_command),
        "catv2ton_command_configured": bool(SETTINGS.catv2ton_command),
        "supabase_url_configured": bool(SETTINGS.supabase_url),
        "supabase_service_role_key_configured": bool(SETTINGS.supabase_service_role_key),
        "supabase_tryon_bucket": SETTINGS.supabase_tryon_bucket,
    }


@app.get("/supabase/health")
def supabase_health() -> dict[str, object]:
    check = check_supabase_storage()
    return {
        "configured": check.configured,
        "bucket": check.bucket,
        "bucket_exists": check.bucket_exists,
        "asset_bucket": "fitshelf-assets",
        "asset_bucket_exists": getattr(check, "asset_bucket_exists", False),
        "upload_ok": check.upload_ok,
        "signed_url_ok": check.signed_url_ok,
        "error": check.error,
    }


@app.get("/supabase/db-health")
def supabase_db_health() -> dict[str, object]:
    check = check_supabase_database()
    return {
        "configured": check.configured,
        "profile_write_ok": check.profile_write_ok,
        "profile_read_ok": check.profile_read_ok,
        "profile_delete_ok": check.profile_delete_ok,
        "priority_tables_ok": getattr(check, "priority_tables_ok", False),
        "patch_file": getattr(check, "patch_file", "ai/supabase/stabilization_patch.sql"),
        "error": check.error,
    }


@app.get("/supabase/schema-health")
def supabase_schema_health() -> dict[str, object]:
    check = check_supabase_schema()
    return {
        "configured": check.configured,
        "ok": check.ok,
        "missing": check.missing,
        "patch_file": check.patch_file,
        "error": check.error,
    }


@app.get("/supabase/sign")
def supabase_sign(request: Request, storage_path: str) -> dict[str, object]:
    cleaned = storage_path.strip().lstrip("/")
    if not cleaned or ".." in cleaned.split("/"):
        raise HTTPException(status_code=400, detail="Invalid storage path")
    signed_url = create_signed_url(cleaned)
    if not signed_url:
        raise HTTPException(status_code=404, detail="Signed URL could not be created")
    return {
        "storage_path": cleaned,
        "supabase_result_url": signed_url,
        "supabase_proxy_url": f"{str(request.base_url).rstrip('/')}/supabase/object?storage_path={quote(cleaned, safe='')}",
        "result_url": signed_url,
    }


@app.get("/supabase/object")
def supabase_object(storage_path: str) -> Response:
    cleaned = storage_path.strip().lstrip("/")
    if not cleaned or ".." in cleaned.split("/"):
        raise HTTPException(status_code=400, detail="Invalid storage path")
    item = download_object(cleaned)
    if not item:
        raise HTTPException(status_code=404, detail="Supabase object could not be downloaded")
    return Response(content=item.content, media_type=item.content_type)


@app.get("/product/images")
def product_images(url: str) -> dict[str, object]:
    try:
        return extract_product_images(url)
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"Product image extraction failed: {str(exc)[:240]}") from exc


@app.post("/tryon")
def tryon(
    request: Request,
    category: str = Form(...),
    render_mode: str = Form("preview"),
    person: UploadFile = File(...),
    garment: UploadFile = File(...),
) -> dict[str, object]:
    if category not in VALID_CATEGORIES:
        raise HTTPException(status_code=400, detail=f"Invalid category: {category}")
    try:
        render_settings = get_render_settings(render_mode)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    job = create_job(category, render_settings)
    job_id = job.job_id
    job_dir = RUNTIME_DIR / job_id
    job_dir.mkdir(parents=True, exist_ok=True)
    person_path = job_dir / "person.jpg"
    garment_path = job_dir / "garment.jpg"
    out_path = job_dir / "result.jpg"

    _save_upload(person, person_path)
    _save_upload(garment, garment_path)

    record = run_job(job_id, person_path, garment_path, category, out_path, job_dir / "debug", render_settings)
    base_url = str(request.base_url).rstrip("/")
    payload = record.to_dict(base_url)
    payload["job_url"] = f"{base_url}/jobs/{job_id}"
    if record.status == "failed":
        raise HTTPException(status_code=500, detail=payload)
    return payload


@app.get("/jobs/{job_id}")
def job_status(request: Request, job_id: str) -> dict[str, object]:
    record = get_job(job_id)
    if not record:
        raise HTTPException(status_code=404, detail="Job not found")
    base_url = str(request.base_url).rstrip("/")
    payload = record.to_dict(base_url)
    payload["job_url"] = f"{base_url}/jobs/{job_id}"
    return payload


@app.get("/results/{job_id}/{filename}")
def result_file(job_id: str, filename: str) -> FileResponse:
    path = RUNTIME_DIR / job_id / filename
    if not path.exists() or not path.is_file():
        raise HTTPException(status_code=404, detail="Result not found")
    return FileResponse(path)
