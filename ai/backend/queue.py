from __future__ import annotations

from dataclasses import asdict, dataclass
from pathlib import Path
from time import time
from uuid import uuid4

from ai.backend.config import RenderSettings
from ai.backend.supabase_store import create_signed_url, upload_tryon_result
from ai.fitshelf_tryon import run_tryon


@dataclass(frozen=True)
class JobRecord:
    job_id: str
    status: str
    category: str | None = None
    render_mode: str | None = None
    width: int | None = None
    height: int | None = None
    steps: int | None = None
    precision: str | None = None
    backend: str | None = None
    result_path: Path | None = None
    metadata_path: Path | None = None
    supabase_result_url: str | None = None
    supabase_storage_path: str | None = None
    local_result_url: str | None = None
    elapsed_seconds: float | None = None
    error: str | None = None
    created_at: float = 0
    updated_at: float = 0

    def to_dict(self, base_url: str | None = None) -> dict[str, object]:
        payload = {
            key: str(value) if isinstance(value, Path) else value
            for key, value in asdict(self).items()
        }
        if base_url and self.result_path:
            local_url = f"{base_url}/results/{self.job_id}/{self.result_path.name}"
            supabase_url = create_signed_url(self.supabase_storage_path) if self.supabase_storage_path else self.supabase_result_url
            payload["local_result_url"] = local_url
            payload["supabase_result_url"] = supabase_url
            payload["supabase_proxy_url"] = (
                f"{base_url}/supabase/object?storage_path={self.supabase_storage_path}" if self.supabase_storage_path else None
            )
            payload["result_url"] = supabase_url or local_url
        else:
            payload["local_result_url"] = None
            payload["supabase_proxy_url"] = None
            payload["result_url"] = None
        if base_url and self.metadata_path:
            payload["metadata_url"] = f"{base_url}/results/{self.job_id}/{self.metadata_path.name}"
        else:
            payload["metadata_url"] = None
        return payload


JOBS: dict[str, JobRecord] = {}
MAX_JOBS = 100
JOB_TTL_SECONDS = 60 * 60 * 12


def cleanup_jobs(now: float | None = None) -> None:
    current_time = now or time()
    expired = [
        job_id
        for job_id, record in JOBS.items()
        if current_time - record.updated_at > JOB_TTL_SECONDS
    ]
    for job_id in expired:
        JOBS.pop(job_id, None)
    if len(JOBS) <= MAX_JOBS:
        return
    for job_id, _record in sorted(JOBS.items(), key=lambda item: item[1].updated_at)[: len(JOBS) - MAX_JOBS]:
        JOBS.pop(job_id, None)


def create_job(category: str, render_settings: RenderSettings | None = None) -> JobRecord:
    now = time()
    cleanup_jobs(now)
    record = JobRecord(
        job_id=str(uuid4()),
        status="queued",
        category=category,
        render_mode=render_settings.render_mode if render_settings else None,
        width=render_settings.width if render_settings else None,
        height=render_settings.height if render_settings else None,
        steps=render_settings.steps if render_settings else None,
        precision=render_settings.precision if render_settings else None,
        created_at=now,
        updated_at=now,
    )
    JOBS[record.job_id] = record
    return record


def set_job(job_id: str, **updates: object) -> JobRecord:
    current = JOBS[job_id]
    values = asdict(current)
    values.update(updates)
    values["updated_at"] = time()
    record = JobRecord(**values)
    JOBS[job_id] = record
    return record


def run_job(
    job_id: str,
    person: Path,
    garment: Path,
    category: str,
    out: Path,
    debug_dir: Path | None = None,
    render_settings: RenderSettings | None = None,
) -> JobRecord:
    set_job(job_id, status="running")
    start = time()
    try:
        result = run_tryon(
            person,
            garment,
            category,
            out,
            debug_dir or out.parent / "debug",
            render_mode=render_settings.render_mode if render_settings else "preview",
        )
        upload = upload_tryon_result(result.output_path, job_id)
        record = set_job(
            job_id,
            status="completed",
            backend=result.backend,
            result_path=result.output_path,
            metadata_path=result.metadata_path,
            supabase_result_url=upload.url if upload else None,
            supabase_storage_path=upload.storage_path if upload else None,
            elapsed_seconds=round(time() - start, 3),
            error=None,
        )
    except Exception as exc:  # pragma: no cover - status surface for worker failures
        record = set_job(job_id, status="failed", elapsed_seconds=round(time() - start, 3), error=str(exc))
    return record


def enqueue_tryon(person: Path, garment: Path, category: str, out: Path) -> JobRecord:
    job = create_job(category)
    return run_job(job.job_id, person, garment, category, out)


def get_job(job_id: str) -> JobRecord | None:
    return JOBS.get(job_id)
