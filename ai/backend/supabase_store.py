from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from uuid import uuid4

import requests

from ai.backend.config import get_settings


@dataclass(frozen=True)
class UploadResult:
    storage_path: str
    url: str
    signed: bool


@dataclass(frozen=True)
class SupabaseStorageCheck:
    configured: bool
    bucket: str | None
    bucket_exists: bool
    upload_ok: bool
    signed_url_ok: bool
    asset_bucket_exists: bool = False
    error: str | None = None


@dataclass(frozen=True)
class SupabaseDbCheck:
    configured: bool
    profile_write_ok: bool
    profile_read_ok: bool
    profile_delete_ok: bool
    priority_tables_ok: bool = False
    patch_file: str = "ai/supabase/stabilization_patch.sql"
    error: str | None = None


@dataclass(frozen=True)
class SupabaseObject:
    content: bytes
    content_type: str


@dataclass(frozen=True)
class SupabaseSchemaCheck:
    configured: bool
    ok: bool
    missing: list[str]
    patch_file: str = "ai/supabase/stabilization_patch.sql"
    error: str | None = None


def _settings_headers() -> tuple[str, str, dict[str, str]] | None:
    settings = get_settings()
    if not settings.supabase_url or not settings.supabase_service_role_key or not settings.supabase_tryon_bucket:
        return None
    base_url = settings.supabase_url.rstrip("/")
    headers = {
        "Authorization": f"Bearer {settings.supabase_service_role_key}",
        "apikey": settings.supabase_service_role_key,
    }
    return base_url, settings.supabase_tryon_bucket, headers


def create_signed_url(storage_path: str, expires_in: int = 60 * 60 * 24 * 30) -> str | None:
    config = _settings_headers()
    if not config:
        return None
    base_url, bucket, headers = config
    try:
        signed = requests.post(
            f"{base_url}/storage/v1/object/sign/{bucket}/{storage_path}",
            headers={**headers, "Content-Type": "application/json"},
            json={"expiresIn": expires_in},
            timeout=20,
        )
        signed.raise_for_status()
        payload = signed.json()
        signed_url = payload.get("signedURL") or payload.get("signedUrl")
        if not signed_url:
            return None
        if signed_url.startswith("http"):
            return signed_url
        if signed_url.startswith("/object/"):
            return f"{base_url}/storage/v1{signed_url}"
        return f"{base_url}{signed_url}"
    except requests.RequestException:
        return None


def download_object(storage_path: str) -> SupabaseObject | None:
    config = _settings_headers()
    if not config:
        return None
    base_url, bucket, headers = config
    try:
        response = requests.get(
            f"{base_url}/storage/v1/object/{bucket}/{storage_path}",
            headers=headers,
            timeout=60,
        )
        response.raise_for_status()
        return SupabaseObject(response.content, response.headers.get("Content-Type", "image/jpeg"))
    except requests.RequestException:
        return None


def upload_tryon_result(path: Path, job_id: str) -> UploadResult | None:
    config = _settings_headers()
    if not config:
        return None
    if not path.exists():
        return None

    base_url, bucket, headers = config
    storage_path = f"{job_id}/{path.name}"

    try:
        with path.open("rb") as handle:
            upload = requests.post(
                f"{base_url}/storage/v1/object/{bucket}/{storage_path}",
                headers={**headers, "Content-Type": "image/jpeg", "x-upsert": "true"},
                data=handle,
                timeout=60,
            )
        upload.raise_for_status()

        signed_url = create_signed_url(storage_path)
        if signed_url:
            return UploadResult(storage_path=storage_path, url=signed_url, signed=True)

        public_url = f"{base_url}/storage/v1/object/public/{bucket}/{storage_path}"
        return UploadResult(storage_path=storage_path, url=public_url, signed=False)
    except requests.RequestException:
        return None


def check_supabase_storage() -> SupabaseStorageCheck:
    config = _settings_headers()
    if not config:
        return SupabaseStorageCheck(
            configured=False,
            bucket=None,
            bucket_exists=False,
            upload_ok=False,
            signed_url_ok=False,
            error="Missing SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, or SUPABASE_TRYON_BUCKET.",
        )
    base_url, bucket, headers = config
    probe_path = "_health/fitshelf-storage-check.txt"
    try:
        bucket_response = requests.get(f"{base_url}/storage/v1/bucket/{bucket}", headers=headers, timeout=20)
        bucket_exists = bucket_response.ok
        asset_bucket_response = requests.get(f"{base_url}/storage/v1/bucket/fitshelf-assets", headers=headers, timeout=20)
        asset_bucket_exists = asset_bucket_response.ok
        if not bucket_exists:
            return SupabaseStorageCheck(True, bucket, False, False, False, asset_bucket_exists, f"Bucket check returned {bucket_response.status_code}.")

        upload = requests.post(
            f"{base_url}/storage/v1/object/{bucket}/{probe_path}",
            headers={**headers, "Content-Type": "text/plain", "x-upsert": "true"},
            data=b"fitshelf storage check",
            timeout=30,
        )
        upload_ok = upload.ok
        signed_url = create_signed_url(probe_path, expires_in=600) if upload_ok else None
        return SupabaseStorageCheck(True, bucket, bucket_exists, upload_ok, bool(signed_url), asset_bucket_exists, None if signed_url else "Signed URL check failed.")
    except requests.RequestException as exc:
        return SupabaseStorageCheck(True, bucket, False, False, False, False, str(exc))


def check_supabase_database() -> SupabaseDbCheck:
    config = _settings_headers()
    if not config:
        return SupabaseDbCheck(False, False, False, False, False, error="Missing SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, or SUPABASE_TRYON_BUCKET.")
    base_url, _bucket, headers = config
    test_id = str(uuid4())
    person_id = str(uuid4())
    wardrobe_id = str(uuid4())
    job_id = str(uuid4())
    look_id = f"db-health-{test_id}"
    rest_headers = {**headers, "Content-Type": "application/json", "Prefer": "return=representation"}

    def cleanup() -> None:
        for table, query in [
            ("saved_looks", f"id=eq.{look_id}&user_id=eq.{test_id}"),
            ("tryon_jobs", f"id=eq.{job_id}&user_id=eq.{test_id}"),
            ("avatar_profiles", f"user_id=eq.{test_id}"),
            ("wardrobe_items", f"id=eq.{wardrobe_id}&user_id=eq.{test_id}"),
            ("person_images", f"id=eq.{person_id}&user_id=eq.{test_id}"),
            ("profiles", f"id=eq.{test_id}"),
        ]:
            try:
                requests.delete(f"{base_url}/rest/v1/{table}?{query}", headers=headers, timeout=10)
            except requests.RequestException:
                pass

    def fail(
        profile_write_ok: bool,
        profile_read_ok: bool,
        profile_delete_ok: bool,
        priority_tables_ok: bool,
        error: str,
    ) -> SupabaseDbCheck:
        cleanup()
        return SupabaseDbCheck(True, profile_write_ok, profile_read_ok, profile_delete_ok, priority_tables_ok, error=error)

    try:
        write = requests.post(
            f"{base_url}/rest/v1/profiles",
            headers=rest_headers,
            json={"id": test_id, "email": "fitshelf-db-health@example.invalid"},
            timeout=20,
        )
        if not write.ok:
            return SupabaseDbCheck(True, False, False, False, False, error=f"profiles write returned {write.status_code}: {write.text[:240]}")
        read = requests.get(
                f"{base_url}/rest/v1/profiles?id=eq.{test_id}&select=id",
            headers=headers,
            timeout=20,
        )
        if not read.ok or not read.json():
            return fail(True, False, False, False, f"profiles read returned {read.status_code}: {read.text[:240]}")

        checks = [
            (
                "person_images",
                {"id": person_id, "user_id": test_id, "label": "db health person", "storage_path": f"_health/{person_id}.jpg", "image_url": "fitshelf-health://person"},
                f"id=eq.{person_id}&user_id=eq.{test_id}",
            ),
            (
                "wardrobe_items",
                {
                    "id": wardrobe_id,
                    "user_id": test_id,
                    "name": "db health garment",
                    "category": "top",
                    "storage_path": f"_health/{wardrobe_id}.jpg",
                    "image_url": "fitshelf-health://garment",
                },
                f"id=eq.{wardrobe_id}&user_id=eq.{test_id}",
            ),
            (
                "tryon_jobs",
                {
                    "id": job_id,
                    "user_id": test_id,
                    "person_image_id": person_id,
                    "wardrobe_item_id": wardrobe_id,
                    "category": "upper",
                    "render_mode": "preview",
                    "status": "completed",
                    "result_storage_path": f"_health/{job_id}/result.jpg",
                    "result_url": "fitshelf-health://result",
                },
                f"id=eq.{job_id}&user_id=eq.{test_id}",
            ),
            (
                "saved_looks",
                {
                    "id": look_id,
                    "user_id": test_id,
                    "name": "db health saved look",
                    "tryon_job_id": job_id,
                    "category": "upper",
                    "render_mode": "preview",
                    "result_url": "fitshelf-health://result",
                    "result_storage_path": f"_health/{job_id}/result.jpg",
                    "local_result_url": "fitshelf-health://local",
                },
                f"id=eq.{look_id}&user_id=eq.{test_id}",
            ),
            (
                "avatar_profiles",
                {
                    "user_id": test_id,
                    "avatar_mode": "female",
                    "height": 68,
                    "weight": 145,
                    "chest": 36,
                    "waist": 30,
                    "hips": 39,
                    "inseam": 30,
                    "shoulder_width": 16,
                },
                f"user_id=eq.{test_id}",
            ),
        ]
        for table, payload, query in checks:
            table_write = requests.post(
                f"{base_url}/rest/v1/{table}",
                headers=rest_headers,
                json=payload,
                timeout=20,
            )
            if not table_write.ok:
                return fail(True, True, False, False, f"{table} write returned {table_write.status_code}: {table_write.text[:240]}")
            table_read = requests.get(
                f"{base_url}/rest/v1/{table}?{query}&select=*",
                headers=headers,
                timeout=20,
            )
            if not table_read.ok or not table_read.json():
                return fail(True, True, False, False, f"{table} read returned {table_read.status_code}: {table_read.text[:240]}")

        for table, query in [
            ("saved_looks", f"id=eq.{look_id}&user_id=eq.{test_id}"),
            ("tryon_jobs", f"id=eq.{job_id}&user_id=eq.{test_id}"),
            ("avatar_profiles", f"user_id=eq.{test_id}"),
            ("wardrobe_items", f"id=eq.{wardrobe_id}&user_id=eq.{test_id}"),
            ("person_images", f"id=eq.{person_id}&user_id=eq.{test_id}"),
        ]:
            table_delete = requests.delete(
                f"{base_url}/rest/v1/{table}?{query}",
                headers=headers,
                timeout=20,
            )
            if not table_delete.ok:
                return fail(True, True, False, False, f"{table} delete returned {table_delete.status_code}: {table_delete.text[:240]}")

        delete = requests.delete(
            f"{base_url}/rest/v1/profiles?id=eq.{test_id}",
            headers=headers,
            timeout=20,
        )
        if not delete.ok:
            cleanup()
            return SupabaseDbCheck(True, True, True, False, True, error=f"profiles delete returned {delete.status_code}: {delete.text[:240]}")
        return SupabaseDbCheck(True, True, True, True, True, error=None)
    except requests.RequestException as exc:
        cleanup()
        return SupabaseDbCheck(True, False, False, False, False, error=str(exc))


def check_supabase_schema() -> SupabaseSchemaCheck:
    config = _settings_headers()
    if not config:
        return SupabaseSchemaCheck(False, False, [], "ai/supabase/stabilization_patch.sql", "Missing SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, or SUPABASE_TRYON_BUCKET.")
    base_url, _bucket, headers = config
    required = {
        "profiles": ["id", "email", "created_at"],
        "person_images": ["id", "user_id", "label", "storage_path", "image_url", "is_default", "created_at"],
        "wardrobe_items": ["id", "user_id", "name", "category", "storage_path", "source_url", "brand", "color", "notes", "favorite", "image_url", "created_at"],
        "tryon_jobs": ["id", "user_id", "person_image_id", "wardrobe_item_id", "category", "render_mode", "width", "height", "steps", "precision", "backend", "status", "result_storage_path", "result_url", "error", "elapsed_seconds", "created_at", "completed_at"],
        "saved_looks": ["id", "user_id", "name", "tryon_job_id", "category", "render_mode", "width", "height", "steps", "precision", "backend", "result_url", "result_storage_path", "local_result_url", "person_uri", "garment_uri", "elapsed_seconds", "created_at", "updated_at"],
        "avatar_profiles": ["user_id", "avatar_mode", "height", "weight", "chest", "waist", "hips", "inseam", "shoulder_width", "updated_at"],
    }
    missing: list[str] = []
    try:
        for table, columns in required.items():
            table_response = requests.get(
                f"{base_url}/rest/v1/{table}",
                headers=headers,
                params={"select": columns[0], "limit": "0"},
                timeout=20,
            )
            if not table_response.ok:
                missing.append(f"{table}: {table_response.status_code} {table_response.text[:240]}")
                continue
            for column in columns:
                response = requests.get(
                    f"{base_url}/rest/v1/{table}",
                    headers=headers,
                    params={"select": column, "limit": "0"},
                    timeout=20,
                )
                if response.ok:
                    continue
                text = response.text[:300]
                if f"'{column}'" in text or f'"{column}"' in text or column in text:
                    missing.append(f"{table}.{column}")
                else:
                    missing.append(f"{table}.{column}: {response.status_code} {text[:180]}")
        return SupabaseSchemaCheck(True, not missing, missing, "ai/supabase/stabilization_patch.sql", None if not missing else "Missing required schema entries. Run ai/supabase/stabilization_patch.sql.")
    except requests.RequestException as exc:
        return SupabaseSchemaCheck(True, False, missing, "ai/supabase/stabilization_patch.sql", str(exc))
