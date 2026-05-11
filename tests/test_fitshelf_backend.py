import os
from pathlib import Path

from fastapi.testclient import TestClient
from PIL import Image, ImageDraw

from ai.backend.config import load_env_file
from ai.backend.config import get_settings
import ai.backend.app as backend_app
import ai.backend.supabase_store as supabase_store


def _image(path: Path, color: tuple[int, int, int]) -> None:
    image = Image.new("RGB", (160, 220), (245, 245, 242))
    draw = ImageDraw.Draw(image)
    draw.rectangle((40, 50, 120, 170), fill=color)
    image.save(path)


def test_tryon_job_status(monkeypatch, tmp_path: Path) -> None:
    runtime = tmp_path / "api"
    monkeypatch.setattr(backend_app, "RUNTIME_DIR", runtime)

    def fake_run_tryon(person, garment, category, out, debug_dir, render_mode="preview"):
        from ai.fitshelf_tryon.pipeline import TryOnResult

        Image.new("RGB", (32, 32), (50, 90, 130)).save(out)
        metadata = out.with_suffix(out.suffix + ".json")
        metadata.write_text("{}", encoding="utf-8")
        return TryOnResult(
            output_path=out,
            backend="catvton-external",
            category=category,
            debug_dir=debug_dir,
            metadata_path=metadata,
            notes=["test"],
        )

    monkeypatch.setattr("ai.backend.queue.run_tryon", fake_run_tryon)
    monkeypatch.setattr("ai.backend.queue.upload_tryon_result", lambda out, job_id: None)
    monkeypatch.setattr("ai.backend.queue.create_signed_url", lambda path: None)

    person = tmp_path / "person.jpg"
    garment = tmp_path / "garment.jpg"
    _image(person, (180, 130, 100))
    _image(garment, (50, 90, 130))

    client = TestClient(backend_app.app)
    with person.open("rb") as person_file, garment.open("rb") as garment_file:
        response = client.post(
            "/tryon",
            data={"category": "upper", "render_mode": "preview"},
            files={
                "person": ("person.jpg", person_file, "image/jpeg"),
                "garment": ("garment.jpg", garment_file, "image/jpeg"),
            },
        )

    assert response.status_code == 200
    payload = response.json()
    assert payload["status"] == "completed"
    assert payload["backend"] == "catvton-external"
    assert payload["render_mode"] == "preview"
    assert payload["width"] == 384
    assert payload["height"] == 512
    assert payload["steps"] == 20
    assert payload["precision"] == "fp16"
    assert isinstance(payload["elapsed_seconds"], float)
    assert payload["result_url"].endswith("/result.jpg")
    assert payload["local_result_url"].endswith("/result.jpg")

    status = client.get(f"/jobs/{payload['job_id']}")
    assert status.status_code == 200
    assert status.json()["status"] == "completed"


def test_tryon_rejects_invalid_render_mode(tmp_path: Path) -> None:
    person = tmp_path / "person.jpg"
    garment = tmp_path / "garment.jpg"
    _image(person, (180, 130, 100))
    _image(garment, (50, 90, 130))

    client = TestClient(backend_app.app)
    with person.open("rb") as person_file, garment.open("rb") as garment_file:
        response = client.post(
            "/tryon",
            data={"category": "upper", "render_mode": "poster"},
            files={
                "person": ("person.jpg", person_file, "image/jpeg"),
                "garment": ("garment.jpg", garment_file, "image/jpeg"),
            },
        )

    assert response.status_code == 400


def test_tryon_returns_supabase_result_url(monkeypatch, tmp_path: Path) -> None:
    runtime = tmp_path / "api"
    monkeypatch.setattr(backend_app, "RUNTIME_DIR", runtime)

    def fake_run_tryon(person, garment, category, out, debug_dir, render_mode="preview"):
        from ai.fitshelf_tryon.pipeline import TryOnResult

        Image.new("RGB", (32, 32), (50, 90, 130)).save(out)
        metadata = out.with_suffix(out.suffix + ".json")
        metadata.write_text("{}", encoding="utf-8")
        return TryOnResult(
            output_path=out,
            backend="catvton-external",
            category=category,
            debug_dir=debug_dir,
            metadata_path=metadata,
            notes=["test"],
        )

    class FakeUpload:
        storage_path = "job/result.jpg"
        url = "https://example.supabase.co/storage/v1/object/sign/tryon/job/result.jpg?token=test"

    monkeypatch.setattr("ai.backend.queue.run_tryon", fake_run_tryon)
    monkeypatch.setattr("ai.backend.queue.upload_tryon_result", lambda out, job_id: FakeUpload())
    monkeypatch.setattr("ai.backend.queue.create_signed_url", lambda path: "https://example.supabase.co/storage/v1/object/sign/tryon/job/result.jpg?token=refreshed")

    person = tmp_path / "person.jpg"
    garment = tmp_path / "garment.jpg"
    _image(person, (180, 130, 100))
    _image(garment, (50, 90, 130))

    client = TestClient(backend_app.app)
    with person.open("rb") as person_file, garment.open("rb") as garment_file:
        response = client.post(
            "/tryon",
            data={"category": "upper", "render_mode": "hd"},
            files={
                "person": ("person.jpg", person_file, "image/jpeg"),
                "garment": ("garment.jpg", garment_file, "image/jpeg"),
            },
        )

    assert response.status_code == 200
    payload = response.json()
    assert payload["render_mode"] == "hd"
    assert payload["width"] == 768
    assert payload["steps"] == 50
    assert payload["precision"] == "no"
    assert payload["result_url"].startswith("https://example.supabase.co/")
    assert payload["supabase_result_url"] == payload["result_url"]
    assert payload["local_result_url"].endswith("/result.jpg")


def test_supabase_health_endpoint(monkeypatch) -> None:
    class FakeCheck:
        configured = True
        bucket = "tryon-results"
        bucket_exists = True
        upload_ok = True
        signed_url_ok = True
        error = None

    monkeypatch.setattr("ai.backend.app.check_supabase_storage", lambda: FakeCheck())

    client = TestClient(backend_app.app)
    response = client.get("/supabase/health")

    assert response.status_code == 200
    payload = response.json()
    assert payload["configured"] is True
    assert payload["bucket_exists"] is True
    assert payload["signed_url_ok"] is True


def test_supabase_db_health_endpoint(monkeypatch) -> None:
    class FakeCheck:
        configured = True
        profile_write_ok = True
        profile_read_ok = True
        profile_delete_ok = True
        priority_tables_ok = True
        error = None

    monkeypatch.setattr("ai.backend.app.check_supabase_database", lambda: FakeCheck())

    client = TestClient(backend_app.app)
    response = client.get("/supabase/db-health")

    assert response.status_code == 200
    payload = response.json()
    assert payload["profile_write_ok"] is True
    assert payload["profile_delete_ok"] is True
    assert payload["priority_tables_ok"] is True
    assert payload["patch_file"] == "ai/supabase/stabilization_patch.sql"


def test_supabase_db_health_endpoint_reports_priority_table_failure(monkeypatch) -> None:
    class FakeCheck:
        configured = True
        profile_write_ok = True
        profile_read_ok = True
        profile_delete_ok = False
        priority_tables_ok = False
        error = "person_images write returned 400: Could not find the 'image_url' column of 'person_images' in the schema cache"

    monkeypatch.setattr("ai.backend.app.check_supabase_database", lambda: FakeCheck())

    client = TestClient(backend_app.app)
    response = client.get("/supabase/db-health")

    assert response.status_code == 200
    payload = response.json()
    assert payload["profile_write_ok"] is True
    assert payload["profile_read_ok"] is True
    assert payload["profile_delete_ok"] is False
    assert payload["priority_tables_ok"] is False
    assert payload["patch_file"] == "ai/supabase/stabilization_patch.sql"
    assert "person_images" in payload["error"]
    assert "image_url" in payload["error"]


def test_supabase_db_health_probe_scopes_priority_rows_by_user() -> None:
    source = Path("ai/backend/supabase_store.py").read_text(encoding="utf-8")

    for table in ["person_images", "wardrobe_items", "tryon_jobs", "saved_looks"]:
        assert f'"{table}"' in source
    assert source.count("&user_id=eq.{test_id}") >= 8


def test_supabase_schema_health_endpoint(monkeypatch) -> None:
    class FakeCheck:
        configured = True
        ok = False
        missing = ["person_images.image_url"]
        patch_file = "ai/supabase/stabilization_patch.sql"
        error = "Missing required schema entries."

    monkeypatch.setattr("ai.backend.app.check_supabase_schema", lambda: FakeCheck())

    client = TestClient(backend_app.app)
    response = client.get("/supabase/schema-health")

    assert response.status_code == 200
    payload = response.json()
    assert payload["ok"] is False
    assert payload["missing"] == ["person_images.image_url"]
    assert payload["patch_file"] == "ai/supabase/stabilization_patch.sql"


def test_supabase_sign_endpoint(monkeypatch) -> None:
    monkeypatch.setattr(
        "ai.backend.app.create_signed_url",
        lambda path: "https://example.supabase.co/storage/v1/object/sign/tryon-results/job/result.jpg?token=refreshed",
    )

    client = TestClient(backend_app.app)
    response = client.get("/supabase/sign", params={"storage_path": "job/result.jpg"})

    assert response.status_code == 200
    payload = response.json()
    assert payload["storage_path"] == "job/result.jpg"
    assert payload["supabase_result_url"] == payload["result_url"]
    assert payload["supabase_proxy_url"].endswith("/supabase/object?storage_path=job%2Fresult.jpg")


def test_supabase_sign_endpoint_encodes_proxy_storage_path(monkeypatch) -> None:
    monkeypatch.setattr(
        "ai.backend.app.create_signed_url",
        lambda path: "https://example.supabase.co/storage/v1/object/sign/tryon-results/job%20id/result%201.jpg?token=refreshed",
    )

    client = TestClient(backend_app.app)
    response = client.get("/supabase/sign", params={"storage_path": "job id/result 1.jpg"})

    assert response.status_code == 200
    payload = response.json()
    assert payload["storage_path"] == "job id/result 1.jpg"
    assert payload["supabase_proxy_url"].endswith("/supabase/object?storage_path=job%20id%2Fresult%201.jpg")


def test_create_signed_url_adds_storage_prefix(monkeypatch) -> None:
    class FakeResponse:
        def raise_for_status(self) -> None:
            return None

        def json(self) -> dict[str, str]:
            return {"signedURL": "/object/sign/tryon-results/job/result.jpg?token=test"}

    monkeypatch.setattr(supabase_store, "_settings_headers", lambda: ("https://example.supabase.co", "tryon-results", {}))
    monkeypatch.setattr(supabase_store.requests, "post", lambda *args, **kwargs: FakeResponse())

    signed = supabase_store.create_signed_url("job/result.jpg")

    assert signed == "https://example.supabase.co/storage/v1/object/sign/tryon-results/job/result.jpg?token=test"


def test_load_env_file(monkeypatch, tmp_path: Path) -> None:
    env_file = tmp_path / ".env"
    env_file.write_text(
        "CATVTON_WIDTH=768\n"
        "CATVTON_HEIGHT=1024\n"
        "CATVTON_STEPS=50\n"
        "CATVTON_MIXED_PRECISION=no\n"
        "FITSHELF_CATVTON_COMMAND='py ai/scripts/run_catvton.py --out {out}'\n",
        encoding="utf-8",
    )
    for key in [
        "CATVTON_WIDTH",
        "CATVTON_HEIGHT",
        "CATVTON_STEPS",
        "CATVTON_MIXED_PRECISION",
        "FITSHELF_CATVTON_COMMAND",
    ]:
        monkeypatch.delenv(key, raising=False)

    loaded = load_env_file(env_file)

    assert "CATVTON_WIDTH" in loaded
    assert "FITSHELF_CATVTON_COMMAND" in loaded
    assert os.environ["CATVTON_STEPS"] == "50"
    assert os.environ["CATVTON_MIXED_PRECISION"] == "no"


def test_backend_env_overrides_shell_env(monkeypatch) -> None:
    monkeypatch.setenv("CATVTON_STEPS", "8")
    monkeypatch.setenv("CATVTON_MIXED_PRECISION", "fp16")

    settings = get_settings()

    assert settings.catvton_steps == 50
    assert settings.catvton_mixed_precision == "no"
