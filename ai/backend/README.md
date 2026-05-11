# FitShelf Backend

## Environment

Backend settings are loaded from root `.env` first, then `ai/backend/.env`.
Values in app env files override shell variables, and `ai/backend/.env` overrides
root `.env`. Copy the example once:

PowerShell:

```powershell
Copy-Item ai/backend/.env.example ai/backend/.env
```

Quality defaults:

```dotenv
CATVTON_WIDTH=768
CATVTON_HEIGHT=1024
CATVTON_STEPS=50
CATVTON_MIXED_PRECISION=no
FITSHELF_CATVTON_COMMAND=ai/.venv-catvton/Scripts/python.exe ai/scripts/run_catvton.py --person {person} --garment {garment} --category {category} --out {out}
```

For a fast smoke run, temporarily set `CATVTON_WIDTH=384`, `CATVTON_HEIGHT=512`,
and `CATVTON_STEPS=1` in `ai/backend/.env`. Do not use 1-step output for visual
quality evaluation; it produces noise-like corruption on this setup. Controlled
tests showed coherent results at 8 steps for both `fp16` and `no` mixed precision,
with the default 50-step setting kept for quality runs.

## Start Backend

Run from `C:\Users\benwe\Projects\OneShot`:

```powershell
.\ai\scripts\start_backend.ps1
```

Override the port without editing `.env`:

```powershell
.\ai\scripts\start_backend.ps1 -PortOverride 8010
```

Equivalent direct command:

```powershell
py -m uvicorn ai.backend.app:app --host 0.0.0.0 --port 8000
```

## Endpoints

- `GET /health`
- `GET /supabase/health`
- `GET /supabase/db-health`
- `GET /supabase/sign?storage_path=...`
- `GET /supabase/object?storage_path=...`
- `GET /product/images?url=...`
- `GET /debug/config`
- `POST /tryon` multipart form with `person`, `garment`, `category`, and optional `render_mode`; runs synchronously for local development and returns a job payload
- `GET /jobs/{job_id}`
- `GET /results/{job_id}/{filename}`

Render modes:

| Mode | Size | Steps | Precision |
| --- | --- | --- | --- |
| `preview` | `384x512` | `20` | `fp16` |
| `hd` | `768x1024` | `50` | `no` |

Job payloads include `render_mode`, `width`, `height`, `steps`, `precision`,
`backend`, `elapsed_seconds`, `local_result_url`, `supabase_storage_path`, and
`supabase_result_url`.
When `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, and `SUPABASE_TRYON_BUCKET`
are configured in `ai/backend/.env`, result images are uploaded through the
backend service-role key. `result_url` points at the Supabase signed/public URL
when upload succeeds, otherwise it falls back to the local backend result URL.
Signed URLs are temporary; persist `supabase_storage_path` and use
`GET /supabase/sign` to generate a fresh display URL when needed.
If a React Native client cannot display a signed URL, `GET /supabase/object`
streams the private object through the backend without exposing the service-role
key.

Use `GET /supabase/health` to check that the private Storage bucket exists, a
small probe object can upload, and a signed URL can be created. The response
reports booleans only and does not expose secret keys.

Use `GET /supabase/db-health` to check service-role table access for
`profiles`. Use `GET /debug/config` for safe non-secret backend config details.

Model backend selection:

```dotenv
FITSHELF_TRYON_BACKEND=catvton
FITSHELF_CATVTON_COMMAND=...
FITSHELF_CATV2TON_COMMAND=
```

`catv2ton` is surfaced as an optional backend but remains disabled until the
dataset-style CatV2TON inference adapter is completed; see `ai/CATV2TON.md`.

Queue note: `ai/backend/queue.py` currently provides a synchronous in-process job registry. It is intentionally shaped so Redis/RQ can replace the body later without changing caller behavior.
