
---

# `vault/projects/fitshelf/PROOF.md`

```md
# FitShelf Proof Log

Document commands, outputs, generated artifacts, screenshots, and verification notes here.

Format:

```md
## YYYY-MM-DD HH:MM - Phase X Proof

Command:
...

Result:
...

Artifacts:
...

Pass/Fail:
...

Notes:
...

## 2026-05-10 19:13 - Phase 1 Local AI Try-On Proof

Command:
`py ai/scripts/run_tryon.py --person ai/samples/person.jpg --garment ai/samples/garment.jpg --category upper --out ai/outputs/result.jpg`

Result:
Exited 0. Output reported `backend=local-fallback`, `metadata=ai\outputs\result.jpg.json`, and `debug_dir=ai\outputs\debug`.

Artifacts:
- `ai/samples/person.jpg`
- `ai/samples/garment.jpg`
- `ai/outputs/result.jpg`
- `ai/outputs/result.jpg.json`
- `ai/outputs/debug/person_normalized.jpg`
- `ai/outputs/debug/garment_normalized.png`
- `ai/outputs/debug/garment_mask.png`
- `ai/outputs/debug/pose_debug.jpg`

Pass/Fail:
Pass for CLI pipeline, stable `run_tryon()` interface, output image generation, preprocessing debug outputs, and CatVTON fallback detection.

Notes:
CatVTON was unavailable because `FITSHELF_CATVTON_COMMAND` is not configured. The same command also passed with full interpreter path `C:\Users\benwe\AppData\Local\Python\bin\python.exe`.

## 2026-05-10 19:13 - Phase 2-4 Backend And Queue Proof

Command:
`py -m compileall ai`

Result:
Exited 0 and compiled the AI package, backend, worker, and scripts.

Command:
Temporary FastAPI server on `127.0.0.1:8010`; checked `GET /health`, posted multipart files to `POST /tryon`, then downloaded the generated result URL.

Result:
`/health` returned `status=ok`. `/tryon` returned `status=completed`, `backend=local-fallback`, result URL on port `8010`, and downloaded 41983 bytes.

Command:
`py ai/backend/worker.py --person ai/samples/person.jpg --garment ai/samples/garment.jpg --category upper --out ai/outputs/worker-result.jpg`

Result:
Exited 0 with `JobRecord(... status='completed', result_path=WindowsPath('ai/outputs/worker-result.jpg'), error=None)`.

Artifacts:
- `ai/backend/app.py`
- `ai/backend/queue.py`
- `ai/backend/worker.py`
- `ai/outputs/worker-result.jpg`
- `ai/outputs/api/*/result.jpg`

Pass/Fail:
Pass for FastAPI health, try-on endpoint, downloadable result URL, and queue-compatible worker fallback.

Notes:
Initial API smoke found hardcoded port `8000` in result URLs. Fixed to derive URLs from `request.base_url` and retested successfully.

## 2026-05-10 19:13 - Phase 5-8 Support Surface Proof

Command:
Inspected created files and ran `py ai/scripts/extract_product_image.py https://example.com`.

Result:
Extractor exited 0 and returned no image for Example Domain, as expected.

Artifacts:
- `ai/supabase/schema.sql`
- `ai/supabase/README.md`
- `ai/scripts/extract_product_image.py`

Pass/Fail:
Pass for schema file presence, RLS draft presence, storage setup notes, and product extraction script execution.

Notes:
No live Supabase credentials or Redis server were configured, so schema application and real async Redis lifecycle remain future environment-backed checks.

## 2026-05-10 19:13 - Regression Proof

Command:
`py -m pytest tests/test_fitshelf_tryon.py`

Result:
`1 passed in 0.07s`.

Command:
`npm run typecheck` from `fitshelf-app/`

Result:
Exited 0 with `tsc --noEmit`.

Artifacts:
- `tests/test_fitshelf_tryon.py`
- `fitshelf-app/`

Pass/Fail:
Pass.

## 2026-05-10T23:56 - Backend Env, Startup, And CatVTON Quality Proof

Command:
`py -m pytest tests/test_fitshelf_backend.py tests/test_fitshelf_tryon.py`

Result:
`4 passed in 0.36s`.

Command:
`py -m compileall ai/backend ai/fitshelf_tryon ai/scripts`

Result:
Exited 0.

Command:
`ai/.venv-catvton/Scripts/python.exe ai/scripts/run_catvton.py --check`

Result:
Exited 0. Reported `torch=2.4.0+cu121` and `cuda_available=True`.

Command:
`.\ai\scripts\start_backend.ps1 -PortOverride 8010`

Result:
Started from `C:\Users\benwe\Projects\OneShot`; `GET http://127.0.0.1:8010/health` returned `status=ok`, `runtime_dir=ai\outputs\api`, and CatVTON settings `width=768`, `height=1024`, `steps=50`, `mixed_precision=no`, `configured=true`. The temporary port-8010 process was stopped after the check.

Command:
`npm run typecheck` from `fitshelf-app/`

Result:
Exited 0 with `tsc --noEmit`.

Command:
`py -m pytest`

Result:
Collected 261 tests after scoping discovery to `tests/`. Result was `252 passed, 9 failed`. Failures were outside the FitShelf backend/app scope and involved Windows path normalization expectations, missing `ffmpeg`, and an existing adversarial-probe expectation.

Controlled CatVTON Outputs:
- `ai/outputs/catvton-quality/upper-384x512-1-fp16.jpg`: corrupted/noisy output.
- `ai/outputs/catvton-quality/upper-384x512-8-fp16.jpg`: coherent output.
- `ai/outputs/catvton-quality/upper-384x512-8-no.jpg`: coherent output.
- `ai/outputs/catvton-quality/upper-768x1024-8-no.jpg`: coherent higher-resolution output.

Conclusion:
The visible corruption is caused primarily by the 1-step smoke setting. `fp16` versus `no` mixed precision was not the deciding factor in the controlled 8-step run. The backend is configured for quality-oriented defaults in `ai/backend/.env`: `CATVTON_WIDTH=768`, `CATVTON_HEIGHT=1024`, `CATVTON_STEPS=50`, `CATVTON_MIXED_PRECISION=no`.

Pass/Fail:
Pass for FitShelf-specific backend/app checks and CatVTON quality investigation. Full repo pytest remains partially failing for unrelated platform issues.

## 2026-05-11T00:36 - Productized 2D Loop And 3D Avatar Foundation Proof

Command:
`py -m pytest tests/test_fitshelf_backend.py tests/test_fitshelf_tryon.py`

Result:
`5 passed in 0.35s`.

Command:
`py -m compileall ai/backend ai/fitshelf_tryon ai/scripts`

Result:
Exited 0.

Command:
`npm run typecheck` from `fitshelf-app/`

Result:
Exited 0 with `tsc --noEmit`.

Command:
Started backend with `.\ai\scripts\start_backend.ps1 -PortOverride 8011` and requested `GET http://127.0.0.1:8011/health`.

Result:
Returned `status=ok`, CatVTON configured, and render modes:
- `preview`: `384x512`, 8 steps, `fp16`
- `hd`: `768x1024`, 50 steps, `no`

Command:
Started Expo Metro on temporary port 8091 and requested `/node_modules/expo/AppEntry.bundle?platform=ios&dev=true&hot=false&lazy=true`.

Result:
Metro responded and the AppEntry bundle returned 11,755,481 bytes. Temporary Metro process was stopped.

Command:
`npm audit --audit-level=moderate --json` from `fitshelf-app/`

Result:
Exited 1 with 4 moderate advisories involving Expo CLI / Metro config / PostCSS. No high or critical advisories remained after replacing `expo-three` with `@react-three/fiber/native`.

Artifacts:
- `ai/backend/config.py`
- `ai/backend/app.py`
- `ai/backend/queue.py`
- `ai/fitshelf_tryon/pipeline.py`
- `tests/test_fitshelf_backend.py`
- `fitshelf-app/src/components/TryOnPanel.tsx`
- `fitshelf-app/src/components/AvatarPanel.tsx`
- `fitshelf-app/src/lib/tryonApi.ts`
- `fitshelf-app/src/lib/storage.ts`
- `fitshelf-app/src/types/models.ts`
- `fitshelf-app/assets/avatar/default-mannequin.glb`
- `fitshelf-app/metro.config.js`
- `fitshelf-app/package.json`
- `fitshelf-app/README.md`

Pass/Fail:
Pass for requested FitShelf verification. Audit has documented moderate Expo dependency advisories.

## 2026-05-11T01:22 - Supabase Persistence And Avatar Customization Proof

Command:
Env key verification without printing secret values.

Result:
`fitshelf-app/.env` has `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY`; it does not have `SUPABASE_SERVICE_ROLE_KEY`. `ai/backend/.env` has `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, and `SUPABASE_TRYON_BUCKET`.

Command:
`py -m pytest tests/test_fitshelf_backend.py tests/test_fitshelf_tryon.py`

Result:
`6 passed in 0.45s`.

Command:
`py -m compileall ai/backend ai/fitshelf_tryon ai/scripts`

Result:
Exited 0.

Command:
`npm run typecheck` from `fitshelf-app/`

Result:
Exited 0 with `tsc --noEmit`.

Command:
Started backend with `.\ai\scripts\start_backend.ps1 -PortOverride 8012` and requested `/health`.

Result:
Returned `status=ok`, render modes with Preview at 20 steps and HD at 50 steps, and Supabase Storage configured without exposing secret values.

Command:
Started Expo Metro on temporary port 8093 and requested `/node_modules/expo/AppEntry.bundle?platform=ios&dev=true&hot=false&lazy=true`.

Result:
Metro returned a 11,773,794 byte AppEntry bundle. Temporary process was stopped.

Artifacts:
- `ai/backend/supabase_store.py`
- `ai/backend/config.py`
- `ai/backend/queue.py`
- `ai/backend/app.py`
- `ai/supabase/schema.sql`
- `ai/supabase/README.md`
- `tests/test_fitshelf_backend.py`
- `fitshelf-app/src/lib/storage.ts`
- `fitshelf-app/src/components/TryOnPanel.tsx`
- `fitshelf-app/src/components/AvatarPanel.tsx`
- `fitshelf-app/src/types/models.ts`
- `fitshelf-app/assets/avatar/default-mannequin.glb`

Pass/Fail:
Pass for local verification. Live Supabase writes require applying the schema and testing with an authenticated user/session.

## 2026-05-11T01:34 - Supabase Auth And Storage Verification Proof

Command:
Env key verification without printing values.

Result:
`fitshelf-app/.env` has public Supabase URL/anon keys and no `SUPABASE_SERVICE_ROLE_KEY`. `ai/backend/.env` has `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, and `SUPABASE_TRYON_BUCKET`.

Command:
`rg "SUPABASE_SERVICE_ROLE_KEY|SERVICE_ROLE" fitshelf-app -n`

Result:
No matches.

Command:
Started backend with `.\ai\scripts\start_backend.ps1 -PortOverride 8014`, then requested `/health` and `/supabase/health`.

Result:
Backend returned `status=ok`. Supabase health returned `configured=true`, `bucket=tryon-results`, `bucket_exists=true`, `upload_ok=true`, `signed_url_ok=true`, and `error=null`.

Command:
`py -m pytest tests/test_fitshelf_backend.py tests/test_fitshelf_tryon.py`

Result:
`7 passed in 0.52s`.

Command:
`py -m compileall ai/backend ai/fitshelf_tryon ai/scripts`

Result:
Exited 0.

Command:
`npm run typecheck` from `fitshelf-app/`

Result:
Exited 0 with `tsc --noEmit`.

Command:
Started Expo Metro on temporary port 8094 and requested `/node_modules/expo/AppEntry.bundle?platform=ios&dev=true&hot=false&lazy=true`.

Result:
Metro returned an 11,785,873 byte AppEntry bundle. Temporary process was stopped.

Artifacts:
- `ai/backend/supabase_store.py`
- `ai/backend/app.py`
- `ai/backend/queue.py`
- `tests/test_fitshelf_backend.py`
- `fitshelf-app/App.tsx`
- `fitshelf-app/src/components/AuthPanel.tsx`
- `fitshelf-app/src/components/TryOnPanel.tsx`
- `fitshelf-app/src/components/AvatarPanel.tsx`
- `fitshelf-app/src/lib/supabase.ts`
- `fitshelf-app/src/lib/storage.ts`
- `ai/supabase/schema.sql`
- `ai/supabase/README.md`

Pass/Fail:
Pass for backend Supabase Storage verification, app compile/bundle verification, and secret-placement verification. Authenticated app database writes still require a signed-in physical-device test.

## 2026-05-10 20:06 - CatVTON API And App Flow Proof

Command:
`ai/.venv-catvton/Scripts/python.exe ai/scripts/run_catvton.py --check --person ai/samples/person.jpg --garment ai/samples/garment.jpg --category upper --out ai/outputs/catvton-check-latest.jpg`

Result:
Exited 0. Output reported `torch=2.4.0+cu121` and `cuda_available=True`.

Command:
Started FastAPI on `127.0.0.1:8020` with:
- `CATVTON_WIDTH=384`
- `CATVTON_HEIGHT=512`
- `CATVTON_STEPS=1`
- `CATVTON_MIXED_PRECISION=fp16`
- `FITSHELF_CATVTON_COMMAND=ai/.venv-catvton/Scripts/python.exe ai/scripts/run_catvton.py --person {person} --garment {garment} --category {category} --out {out}`

Then posted multipart `person`, `garment`, and `category=upper` to `/tryon`, queried `/jobs/{job_id}`, and downloaded `result_url`.

Result:
`/health` returned `ok`. `/tryon` returned `status=completed`, `backend=catvton-external`, `job_url`, `result_url`, and metadata path. `/jobs/{job_id}` returned the same completed job. Downloaded result image was 66754 bytes.

Artifacts:
- `ai/backend/app.py`
- `ai/backend/queue.py`
- `ai/backend/README.md`
- `ai/outputs/api/28ba5744be2844599729f6ee859da95b/result.jpg`
- `fitshelf-app/src/components/TryOnPanel.tsx`
- `fitshelf-app/src/lib/tryonApi.ts`
- `fitshelf-app/.env.example`
- `.env.example`

Pass/Fail:
Pass.

Notes:
Added `GET /jobs/{job_id}` and in-memory status records. The API remains synchronous for local development while exposing a job payload compatible with later async queue work.

## 2026-05-10 20:06 - Final Regression Proof

Command:
`py -m pytest tests/test_fitshelf_tryon.py tests/test_fitshelf_backend.py`

Result:
`2 passed in 0.30s`.

Command:
`py -m compileall ai/fitshelf_tryon ai/scripts ai/backend`

Result:
Exited 0.

Command:
`npm run typecheck` from `fitshelf-app/`

Result:
Exited 0 with `tsc --noEmit`.

Pass/Fail:
Pass.

Notes:
The first backend status test failed because endpoint annotations were too narrow for timestamp fields. Fixed by returning `dict[str, object]` from job payload endpoints, then reran successfully.

Notes:
Installed `pytest` into the active Python 3.14 environment after the first test attempt reported `No module named pytest`.

## 2026-05-10 19:16 - Phase 6 Mobile Try-On Connection Proof

Command:
`npm run typecheck` from `fitshelf-app/`

Result:
Exited 0 with `tsc --noEmit`.

Artifacts:
- `fitshelf-app/src/components/TryOnPanel.tsx`
- `fitshelf-app/src/lib/tryonApi.ts`
- `fitshelf-app/App.tsx`
- `fitshelf-app/src/types/models.ts`

Pass/Fail:
Pass.

Notes:
Added a mobile try-on panel that selects the active mannequin, selects a garment, chooses `upper`, `lower`, or `dress`, posts multipart data to the FastAPI backend, and displays the returned result image URL. Live device/emulator submit remains environment-dependent because a phone simulator may need a LAN-accessible backend URL instead of `127.0.0.1`.

## 2026-05-10 19:43 - CatVTON Installation And Integration Proof

Command:
`git clone https://github.com/Zheng-Chong/CatVTON.git ai/vendor/CatVTON`

Result:
Official CatVTON source cloned locally.

Command:
`py install 3.9 -y`

Result:
Installed Python 3.9.13 through Windows Python Manager.

Command:
`py -3.9 -m venv ai/.venv-catvton`

Result:
Created isolated CatVTON virtual environment.

Command:
`ai/.venv-catvton/Scripts/python.exe -m pip install -r ai/requirements-catvton-windows.txt`

Result:
Installed the CatVTON dependency set after applying Windows-compatible pins for Diffusers, Matplotlib, and PEFT omission.

Command:
`ai/.venv-catvton/Scripts/python.exe -m pip install --force-reinstall torch==2.4.0+cu121 torchvision==0.19.0+cu121 --index-url https://download.pytorch.org/whl/cu121`

Result:
Installed CUDA PyTorch. Readiness check reported `torch=2.4.0+cu121` and `cuda_available=True`.

Command:
`ai/.venv-catvton/Scripts/python.exe ai/scripts/run_catvton.py --person ai/samples/person.jpg --garment ai/samples/garment.jpg --category upper --out ai/outputs/catvton-real-test.jpg --width 384 --height 512 --steps 1 --mixed-precision fp16`

Result:
Exited 0 with `backend=catvton` and wrote `ai/outputs/catvton-real-test.jpg`.

Command:
Set `CATVTON_WIDTH=384`, `CATVTON_HEIGHT=512`, `CATVTON_STEPS=1`, `CATVTON_MIXED_PRECISION=fp16`, and `FITSHELF_CATVTON_COMMAND=ai/.venv-catvton/Scripts/python.exe ai/scripts/run_catvton.py --person {person} --garment {garment} --category {category} --out {out}`.

Then ran:
`py ai/scripts/run_tryon.py --person ai/samples/person.jpg --garment ai/samples/garment.jpg --category upper --out ai/outputs/result-catvton-integrated.jpg`

Result:
Exited 0 with `backend=catvton-external`, metadata at `ai\outputs\result-catvton-integrated.jpg.json`, and output at `ai\outputs\result-catvton-integrated.jpg`.

Artifacts:
- `ai/vendor/CatVTON`
- `ai/scripts/run_catvton.py`
- `ai/scripts/setup_catvton.ps1`
- `ai/requirements-catvton-windows.txt`
- `ai/CATVTON.md`
- `ai/models/` local Hugging Face snapshots
- `ai/.venv-catvton/` local CatVTON environment
- `ai/outputs/catvton-real-test.jpg`
- `ai/outputs/result-catvton-integrated.jpg`

Pass/Fail:
Pass.

Notes:
First install attempt failed on upstream `matplotlib==3.9.1` source build; fixed with `3.9.1.post1`. Second install attempt failed because Diffusers main now requires Python 3.10+; fixed with `diffusers==0.30.3`. PEFT conflicted with CatVTON's pinned Accelerate; omitted for the base CatVTON runner. First real model download failed due Windows symlink privileges in the Hugging Face cache; fixed by downloading snapshots to project-local `ai/models` through the adapter.

## 2026-05-10 19:43 - Post-CatVTON Regression Proof

Command:
`py -m pytest tests/test_fitshelf_tryon.py`

Result:
`1 passed in 0.08s`.

Command:
`py -m compileall ai/fitshelf_tryon ai/scripts ai/backend`

Result:
Exited 0.

Command:
`npm run typecheck` from `fitshelf-app/`

Result:
Exited 0 with `tsc --noEmit`.

Pass/Fail:
Pass.
## 2026-05-11T02:17 - Signed Result Display And Avatar Upgrade Proof

Code proof:
- `ai/backend/app.py` exposes `GET /supabase/sign?storage_path=...`.
- `ai/backend/supabase_store.py` creates signed URLs with a 30-day default expiration.
- `ai/backend/queue.py` returns `local_result_url`, `supabase_storage_path`, `supabase_result_url`, and `result_url`.
- `fitshelf-app/src/components/TryOnPanel.tsx` stores signed display URLs separately from permanent storage paths, refreshes signed URLs, cache-busts result images, and falls back to the backend local result URL.
- `fitshelf-app/src/types/models.ts` and `fitshelf-app/src/lib/storage.ts` persist `resultStoragePath` and `localResultUrl` for Saved Looks.
- `ai/supabase/schema.sql` adds `result_storage_path` and `local_result_url` columns to `saved_looks`.
- `fitshelf-app/src/components/AvatarPanel.tsx` uses `@react-three/fiber/native` and `@react-three/drei/native`.
- `fitshelf-app/metro.config.js` supports `glb`, `gltf`, `png`, `jpg`, `jpeg`, `cjs`, and `mjs`.
- `fitshelf-app/assets/avatar/default-mannequin.glb` was regenerated by `fitshelf-app/scripts/generate-avatar-glb.mjs`.

Verification commands:

```powershell
cd C:\Users\benwe\Projects\OneShot\fitshelf-app
npm run typecheck
```

Result: passed.

```powershell
cd C:\Users\benwe\Projects\OneShot
py -m pytest tests/test_fitshelf_backend.py tests/test_fitshelf_tryon.py
```

Result: 8 passed.

```powershell
py -m compileall ai/backend ai/fitshelf_tryon ai/scripts
```

Result: passed.

Live backend Supabase smoke:

```json
{
  "Configured": true,
  "BucketExists": true,
  "UploadOk": true,
  "SignedUrlOk": true,
  "SignEndpointPath": "_health/fitshelf-storage-check.txt",
  "SignEndpointHasUrl": true
}
```

Metro bundle smoke:

```text
Expo bundle request OK: 21980338 bytes
```

Dependency check:

```text
@react-three/drei@10.7.7
@react-three/fiber@9.6.1
expo-asset@12.0.13
expo-file-system@19.0.22
expo-gl@16.0.10
three@0.166.0
```

Secret exposure check:

```powershell
rg "SUPABASE_SERVICE_ROLE_KEY|SERVICE_ROLE" fitshelf-app -n
```

Result: no matches.
## 2026-05-11T13:05 - Completion Audit And Schema Block Proof

Prompt-to-artifact audit:
- Persistence tables `person_images`, `wardrobe_items`, `saved_looks`, `avatar_profiles`, and `tryon_jobs`: implemented in app storage paths, backend health checks, schema files, and debug actions, but live schema is not patched yet.
- Clear `Save Person`, `Save Garment`, and `Save Look`: present in `fitshelf-app/src/components/TryOnPanel.tsx`; save actions are blocked after a failed schema check and now show a visible schema-blocked message.
- Correct `user_id`: app writes use the signed-in Supabase session user; backend service-role health writes use transient test ids and cleanup.
- Stop silently masking DB failures: signed-in load/save failures throw sanitized table-specific UI errors instead of silently falling back.
- DB/sync debug panel: app header includes `Test Supabase`, `Test DB Write`, and `Test Asset Upload`; Try-On includes `Test Backend Schema`.
- Result images: saved looks keep `resultStoragePath`; reopen refreshes signed URL; image errors fall back to backend proxy/local URL; image keys cache-bust reloads.
- Avatar: `default-mannequin.glb` is primary via R3F `useGLTF`; procedural avatar remains only for hard load failure; touch drag/pinch controls and numeric inputs are implemented.
- Auth redirect: Expo Linking callback handling and redirect URL docs are present.
- CatV2TON: not prioritized; CatVTON path remains the active backend.

Audit result:
- Not complete. The remaining uncovered requirements are live Supabase schema application and physical-device verification.
- No DDL-capable credential was found in the workspace: no Supabase CLI link and no database URL. The backend service-role key is not enough to run `alter table` SQL.

Live backend schema health on temporary port 8031:

```json
{
  "Health": "ok",
  "SchemaOk": false,
  "PatchFile": "ai/supabase/stabilization_patch.sql",
  "SchemaMissing": [
    "person_images.label",
    "person_images.image_url",
    "wardrobe_items.color",
    "wardrobe_items.favorite",
    "wardrobe_items.image_url",
    "saved_looks.tryon_job_id",
    "saved_looks.result_storage_path",
    "saved_looks.local_result_url"
  ],
  "Error": "Missing required schema entries. Run ai/supabase/stabilization_patch.sql."
}
```

Verification:

```powershell
cd fitshelf-app
npm run typecheck
```

Result: passed.

```powershell
py -m pytest tests/test_fitshelf_backend.py tests/test_fitshelf_tryon.py
```

Result: 11 passed.

```powershell
py -m compileall ai/backend ai/fitshelf_tryon ai/scripts
```

Result: passed.

Expo bundle smoke on temporary port 8111:

```text
HTTP 200, 22,083,285 bytes
```

Secret and cleanup checks:
- `rg "SUPABASE_SERVICE_ROLE_KEY|SERVICE_ROLE" fitshelf-app -n` returned no matches.
- Temporary ports 8031 and 8111 were clear after smoke checks.
## 2026-05-11T13:00 - Schema Failure Save Gate Proof

Code proof:
- `fitshelf-app/src/components/TryOnPanel.tsx` tracks `schemaReady` as `unknown`, `pass`, or `fail`.
- `Test Backend Schema` sets `schemaReady=pass` only when `/supabase/schema-health` returns `ok=true`.
- Failed schema checks set `schemaReady=fail`.
- Changing the backend URL resets schema readiness to `unknown`.
- `Save Person`, `Save Garment`, and `Save Look` are disabled while `schemaReady=fail`.

Verification:

```powershell
cd fitshelf-app
npm run typecheck
```

Result: passed.

```powershell
py -m pytest tests/test_fitshelf_backend.py tests/test_fitshelf_tryon.py
```

Result: 11 passed.

```powershell
py -m compileall ai/backend ai/fitshelf_tryon ai/scripts
```

Result: passed.

Live backend schema health on temporary port 8030:

```json
{
  "Health": "ok",
  "SchemaOk": false,
  "PatchFile": "ai/supabase/stabilization_patch.sql",
  "SchemaMissing": [
    "person_images.label",
    "person_images.image_url",
    "wardrobe_items.color",
    "wardrobe_items.favorite",
    "wardrobe_items.image_url",
    "saved_looks.tryon_job_id",
    "saved_looks.result_storage_path",
    "saved_looks.local_result_url"
  ],
  "Error": "Missing required schema entries. Run ai/supabase/stabilization_patch.sql."
}
```

Expo bundle smoke on temporary port 8110:

```text
HTTP 200, 22,082,825 bytes
```

Secret check:

```powershell
rg "SUPABASE_SERVICE_ROLE_KEY|SERVICE_ROLE" fitshelf-app -n
```

Result: no matches.
## 2026-05-11T03:00 - Overnight Product Hardening Proof

Implemented surfaces:
- Auth/profile: `fitshelf-app/src/components/AuthPanel.tsx`, `fitshelf-app/src/lib/supabase.ts`, `fitshelf-app/App.tsx`.
- Schema-aligned persistence: `fitshelf-app/src/lib/storage.ts`, `ai/supabase/schema.sql`.
- Private image display: `ai/backend/supabase_store.py`, `ai/backend/app.py`, `ai/backend/queue.py`, `fitshelf-app/src/components/TryOnPanel.tsx`.
- GLB avatar hardening: `fitshelf-app/src/components/AvatarPanel.tsx`.
- CatV2TON optional backend: `ai/vendor/CatV2TON`, `ai/scripts/run_catv2ton.py`, `ai/CATV2TON.md`, `ai/backend/config.py`, `ai/fitshelf_tryon/pipeline.py`.
- Wardrobe/person/product URL flow: `fitshelf-app/src/components/LibraryPanel.tsx`, `fitshelf-app/src/lib/productApi.ts`, `ai/scripts/extract_product_image.py`, `ai/backend/app.py`.
- Backend robustness: `/debug/config`, upload type/size validation, job cleanup.

Verification commands:

```powershell
cd C:\Users\benwe\Projects\OneShot\fitshelf-app
npm run typecheck
```

Result: passed.

```powershell
cd C:\Users\benwe\Projects\OneShot
py -m pytest tests/test_fitshelf_backend.py tests/test_fitshelf_tryon.py
```

Result: 9 passed.

```powershell
py -m compileall ai/backend ai/fitshelf_tryon ai/scripts
```

Result: passed.

```powershell
ai/.venv-catvton/Scripts/python.exe ai/scripts/run_catv2ton.py --check
```

Result:

```text
repo=C:\Users\benwe\Projects\OneShot\ai\vendor\CatV2TON
torch=2.4.0+cu121
diffusers=0.30.3
transformers=4.46.3
cuda_available=True
```

Live backend smoke:

```json
{
  "Health": "ok",
  "DebugBackend": "catvton",
  "CatV2TONConfigured": false,
  "StorageOk": true,
  "DbOk": true,
  "SignedPath": "/storage/v1/object/sign/tryon-results/_health/fitshelf-storage-check.txt",
  "DirectSignedStatus": 200,
  "ProxyStatus": 200
}
```

Expo bundle smoke:

```text
Expo bundle OK: 22020445 bytes
```

Secret exposure check:

```powershell
rg "SUPABASE_SERVICE_ROLE_KEY|SERVICE_ROLE" fitshelf-app -n
```

Result: no matches.
## 2026-05-11T10:50 - Focused Stabilization Proof

Code proof:
- `fitshelf-app/src/lib/supabase.ts`: `testSupabaseDbWrite()` now verifies `profiles`, writes/reads `avatar_profiles`, and writes/reads/deletes a harmless `saved_looks` row.
- `fitshelf-app/src/components/TryOnPanel.tsx`: repeated signed URL failures for the same storage path now switch to backend proxy fallback instead of repeatedly refreshing signed URLs.
- `fitshelf-app/src/components/AvatarPanel.tsx`: GLB asset is resolved with `expo-asset` before `useGLTF()`, keeping the real GLB as the primary path.
- `tests/test_fitshelf_backend.py`: added regression coverage for Supabase signed URL path normalization.

Verification commands:

```powershell
py -m pytest tests/test_fitshelf_backend.py tests/test_fitshelf_tryon.py
```

Result: 10 passed.

```powershell
py -m compileall ai/backend ai/fitshelf_tryon ai/scripts
```

Result: passed.

```powershell
cd fitshelf-app
npm run typecheck
```

Result: passed.

Live backend smoke:

```json
{
  "Health": "ok",
  "StorageOk": true,
  "DbOk": true,
  "SignedPath": "/storage/v1/object/sign/tryon-results/_health/fitshelf-storage-check.txt",
  "DirectSignedStatus": 200,
  "ProxyStatus": 200
}
```

Expo bundle smoke:

```text
Expo bundle OK: 22024314 bytes
```

Secret check:

```powershell
rg "SUPABASE_SERVICE_ROLE_KEY|SERVICE_ROLE" fitshelf-app -n
```

Result: no matches.
## 2026-05-11T11:13 - Expo Supabase Email Redirect Proof

Code proof:
- `fitshelf-app/app.json` includes `"scheme": "fitshelf"`.
- `fitshelf-app/src/lib/supabase.ts` exports `getAuthRedirectUrl()` using Expo Linking and `handleSupabaseAuthCallback()` for both auth-code and hash-token callbacks.
- `fitshelf-app/src/components/AuthPanel.tsx` passes `emailRedirectTo` to `supabase.auth.signUp()` and displays the generated redirect URL.
- `fitshelf-app/App.tsx` handles auth callback URLs from both cold start and `Linking.addEventListener("url", ...)`.
- `ai/supabase/README.md` and `fitshelf-app/README.md` document Supabase URL Configuration for Expo and production.

Verification:

```powershell
cd fitshelf-app
npm run typecheck
```

Result: passed.

```powershell
py -m pytest tests/test_fitshelf_backend.py tests/test_fitshelf_tryon.py
```

Result: 10 passed.

```powershell
py -m compileall ai/backend ai/fitshelf_tryon ai/scripts
```

Result: passed.

```text
Expo bundle OK: 22060926 bytes
```

```powershell
rg "SUPABASE_SERVICE_ROLE_KEY|SERVICE_ROLE" fitshelf-app -n
```

Result: no matches.
## 2026-05-11T11:59 - Persistence And Avatar Control Stabilization Proof

Code proof:
- `fitshelf-app/src/components/TryOnPanel.tsx` exposes `Save Person`, `Save Garment`, and `Save Look` actions. Render completion calls `saveTryOnJobRecord()`; `Save Look` calls `saveSavedLooks()`.
- `fitshelf-app/App.tsx` wires Try-On `Save Person` and `Save Garment` to the same Supabase/local persistence path used by the Closet.
- `fitshelf-app/src/lib/supabase.ts` expands `Test DB Write` to create/read harmless rows in `person_images`, `wardrobe_items`, `tryon_jobs`, and `saved_looks`, plus write/read `avatar_profiles` and verify `profiles`.
- `ai/supabase/schema.sql` adds `saved_looks.tryon_job_id uuid references tryon_jobs(id)`.
- `fitshelf-app/src/lib/storage.ts` now sanitizes `saved_looks` and `avatar_profiles` write errors with table names before exposing them in the UI.
- `fitshelf-app/src/components/AvatarPanel.tsx` replaces rotate/zoom buttons with touch drag rotation and pinch zoom, keeps GLB-first loading, and labels unsupported rigged morphs as unsupported.

Verification:

```powershell
cd fitshelf-app
npm run typecheck
```

Result: passed.

```powershell
py -m pytest tests/test_fitshelf_backend.py tests/test_fitshelf_tryon.py
```

Result: 10 passed.

```powershell
py -m compileall ai/backend ai/fitshelf_tryon ai/scripts
```

Result: passed.

Live backend smoke on temporary port 8015:

```json
{
  "Health": "ok",
  "SupabaseStorageConfigured": true,
  "SupabaseBucketExists": true,
  "SupabaseUploadOk": true,
  "SupabaseSignedUrlOk": true,
  "SupabaseDbConfigured": true,
  "SupabaseProfileWriteOk": true,
  "SupabaseProfileReadOk": true,
  "SupabaseProfileDeleteOk": true,
  "StorageError": null,
  "DbError": null
}
```

Expo bundle smoke on temporary port 8097:

```text
HTTP 200, 22,071,369 bytes
```

Secret check:

```powershell
rg "SUPABASE_SERVICE_ROLE_KEY|SERVICE_ROLE" fitshelf-app -n
```

Result: no matches.
## 2026-05-11T12:08 - Persistence Failure Visibility And Asset Bucket Proof

Code proof:
- `fitshelf-app/src/lib/storage.ts` throws sanitized load errors for signed-in `person_images`, `wardrobe_items`, `saved_looks`, and `avatar_profiles` query failures instead of silently returning local fallback data.
- `fitshelf-app/App.tsx`, `fitshelf-app/src/components/TryOnPanel.tsx`, and `fitshelf-app/src/components/AvatarPanel.tsx` catch those load errors and surface them in the visible sync/error UI.
- `fitshelf-app/src/components/TryOnPanel.tsx` only marks `Look Saved` after `persistLook()` returns success from `saveTryOnJobRecord()` and `saveSavedLooks()`.
- `fitshelf-app/src/lib/storage.ts` only syncs `person_images` and `wardrobe_items` rows when the item has a real `storagePath`.
- `fitshelf-app/App.tsx` preserves and displays the Supabase Storage upload error instead of overwriting it with a generic saved message.
- `ai/supabase/schema.sql` creates `fitshelf-assets`, `tryon-results`, and the `fitshelf assets own objects` storage policy.
- `ai/backend/app.py` and `ai/backend/supabase_store.py` report `asset_bucket_exists` from `/supabase/health`.

Verification:

```powershell
cd fitshelf-app
npm run typecheck
```

Result: passed.

```powershell
py -m pytest tests/test_fitshelf_backend.py tests/test_fitshelf_tryon.py
```

Result: 10 passed.

```powershell
py -m compileall ai/backend ai/fitshelf_tryon ai/scripts
```

Result: passed.

Live Supabase asset bucket creation:

```json
{
  "Bucket": "fitshelf-assets",
  "Public": true,
  "CreatedThisRun": true
}
```

Live backend smoke on temporary port 8017:

```json
{
  "Health": "ok",
  "ResultBucket": "tryon-results",
  "ResultBucketExists": true,
  "AssetBucket": "fitshelf-assets",
  "AssetBucketExists": true,
  "SupabaseUploadOk": true,
  "SupabaseSignedUrlOk": true,
  "SupabaseDbConfigured": true,
  "SupabaseProfileWriteOk": true,
  "SupabaseProfileReadOk": true,
  "SupabaseProfileDeleteOk": true,
  "StorageError": null,
  "DbError": null
}
```

Expo bundle smoke on temporary port 8098:

```text
HTTP 200, 22,073,195 bytes
```

Secret check:

```powershell
rg "SUPABASE_SERVICE_ROLE_KEY|SERVICE_ROLE" fitshelf-app -n
```

Result: no matches.
## 2026-05-11T12:14 - Default GLB Mannequin Replacement Proof

Code proof:
- `fitshelf-app/scripts/generate-avatar-glb.mjs` now generates a smoother mannequin GLB from lathed/tapered mesh forms and does not use `CapsuleGeometry`.
- `fitshelf-app/src/components/AvatarPanel.tsx` uses `Suspense fallback={null}` for normal GLB loading and only renders `ProceduralAvatar` when `modelStatus === "fallback"` or the error boundary catches a GLB failure.
- `fitshelf-app/assets/avatar/default-mannequin.glb` was regenerated.

Asset verification:

```powershell
node scripts/generate-avatar-glb.mjs
```

Result:

```text
Wrote C:\Users\benwe\Projects\OneShot\fitshelf-app\assets\avatar\default-mannequin.glb (517380 bytes)
```

GLB parse check with Three.js `GLTFLoader`:

```json
{
  "meshes": 19,
  "badVertices": 0,
  "root": "FitShelfDefaultGlbMannequin"
}
```

Geometry fallback check:

```powershell
rg "CapsuleGeometry" fitshelf-app/src fitshelf-app/scripts -n
```

Result: no matches.
## 2026-05-11T12:19 - App-Side Asset Upload Debug Action Proof

Code proof:
- `fitshelf-app/src/lib/supabase.ts` exports `testSupabaseAssetUpload()`.
- `testSupabaseAssetUpload()` ensures a signed-in profile, uploads a harmless text `Blob` to `fitshelf-assets` under `<user_id>/_debug/`, verifies a public URL is returned, and deletes the object.
- `fitshelf-app/App.tsx` wires this into the visible sync panel as `Test Asset Upload`.
- `fitshelf-app/README.md` and `ai/supabase/README.md` document the action.

Verification:

```powershell
cd fitshelf-app
npm run typecheck
```

Result: passed.

```powershell
py -m pytest tests/test_fitshelf_backend.py tests/test_fitshelf_tryon.py
```

Result: 10 passed.

```powershell
py -m compileall ai/backend ai/fitshelf_tryon ai/scripts
```

Result: passed.

Live backend smoke on temporary port 8019:

```json
{
  "Health": "ok",
  "ResultBucketExists": true,
  "AssetBucketExists": true,
  "SupabaseUploadOk": true,
  "SupabaseSignedUrlOk": true,
  "SupabaseProfileWriteOk": true,
  "SupabaseProfileReadOk": true,
  "SupabaseProfileDeleteOk": true,
  "StorageError": null,
  "DbError": null
}
```

Expo bundle smoke on temporary port 8100:

```text
HTTP 200, 22,076,527 bytes
```

Secret check:

```powershell
rg "SUPABASE_SERVICE_ROLE_KEY|SERVICE_ROLE" fitshelf-app -n
```

Result: no matches.
## 2026-05-11T12:23 - Result Image Fallback Tightening Proof

Code proof:
- `fitshelf-app/src/components/TryOnPanel.tsx` adds `withProxyUrl()` to derive `/supabase/object?storage_path=...` from durable `supabase_storage_path`.
- `handleResultImageError()` now prefers backend proxy fallback when a signed image URL fails and a storage path exists.
- If proxy is unavailable but `local_result_url` exists, the app switches to the local backend result URL.
- Saved Look open still calls `refreshSupabaseSignedUrl()` from `resultStoragePath`.

Verification:

```powershell
cd fitshelf-app
npm run typecheck
```

Result: passed.

```powershell
py -m pytest tests/test_fitshelf_backend.py tests/test_fitshelf_tryon.py
```

Result: 10 passed.

```powershell
py -m compileall ai/backend ai/fitshelf_tryon ai/scripts
```

Result: passed.

Live backend smoke on temporary port 8021:

```json
{
  "Health": "ok",
  "ResultBucketExists": true,
  "AssetBucketExists": true,
  "SupabaseUploadOk": true,
  "SupabaseSignedUrlOk": true,
  "SupabaseProfileWriteOk": true,
  "SupabaseProfileReadOk": true,
  "SupabaseProfileDeleteOk": true,
  "StorageError": null,
  "DbError": null
}
```

Expo bundle smoke on temporary port 8101:

```text
HTTP 200, 22,078,186 bytes
```

Secret check:

```powershell
rg "SUPABASE_SERVICE_ROLE_KEY|SERVICE_ROLE" fitshelf-app -n
```

Result: no matches.
## 2026-05-11T12:26 - Manual Builder Labeling Proof

Code proof:
- `fitshelf-app/App.tsx` renames the legacy `outfits` nav section to `manual`.
- `fitshelf-app/App.tsx` adds a local-only notice on the manual builder screen.
- `fitshelf-app/src/components/SavedOutfits.tsx` now labels saved local composites as `Manual Drafts`.

Verification:

```powershell
cd fitshelf-app
npm run typecheck
```

Result: passed.

```powershell
py -m pytest tests/test_fitshelf_backend.py tests/test_fitshelf_tryon.py
```

Result: 10 passed.

```powershell
py -m compileall ai/backend ai/fitshelf_tryon ai/scripts
```

Result: passed.

Live backend smoke on temporary port 8022:

```json
{
  "Health": "ok",
  "ResultBucketExists": true,
  "AssetBucketExists": true,
  "SupabaseUploadOk": true,
  "SupabaseSignedUrlOk": true,
  "SupabaseProfileWriteOk": true,
  "SupabaseProfileReadOk": true,
  "SupabaseProfileDeleteOk": true,
  "StorageError": null,
  "DbError": null
}
```

Expo bundle smoke on temporary port 8102:

```text
HTTP 200, 22,079,165 bytes
```

Secret check:

```powershell
rg "SUPABASE_SERVICE_ROLE_KEY|SERVICE_ROLE" fitshelf-app -n
```

Result: no matches.
## 2026-05-11T12:29 - Full Supabase DB Health Check And Schema Patch Proof

Code proof:
- `ai/backend/supabase_store.py` expands `check_supabase_database()` beyond `profiles`.
- `ai/backend/app.py` exposes `priority_tables_ok` from `/supabase/db-health`.
- `tests/test_fitshelf_backend.py` asserts `priority_tables_ok`.
- `ai/supabase/stabilization_patch.sql` contains the idempotent existing-project patch for latest columns and `fitshelf-assets` storage policy.
- `ai/supabase/README.md` documents the patch.

Verification:

```powershell
cd fitshelf-app
npm run typecheck
```

Result: passed.

```powershell
py -m pytest tests/test_fitshelf_backend.py tests/test_fitshelf_tryon.py
```

Result: 10 passed.

```powershell
py -m compileall ai/backend ai/fitshelf_tryon ai/scripts
```

Result: passed.

Live backend smoke on temporary port 8023:

```json
{
  "Health": "ok",
  "ResultBucketExists": true,
  "AssetBucketExists": true,
  "SupabaseUploadOk": true,
  "SupabaseSignedUrlOk": true,
  "SupabaseProfileWriteOk": true,
  "SupabaseProfileReadOk": true,
  "SupabaseProfileDeleteOk": false,
  "PriorityTablesOk": false,
  "StorageError": null,
  "DbError": "person_images write returned 400: {\"code\":\"PGRST204\",\"details\":null,\"hint\":null,\"message\":\"Could not find the 'image_url' column of 'person_images' in the schema cache\"}"
}
```

Expo bundle smoke on temporary port 8103:

```text
HTTP 200, 22,079,165 bytes
```

Secret check:

```powershell
rg "SUPABASE_SERVICE_ROLE_KEY|SERVICE_ROLE" fitshelf-app -n
```

Result: no matches.
## 2026-05-11T12:35 - Debug Check Cleanup Hardening Proof

Code proof:
- `ai/backend/supabase_store.py` adds cleanup for backend DB-health rows across `saved_looks`, `tryon_jobs`, `avatar_profiles`, `wardrobe_items`, `person_images`, and the temporary `profiles` row.
- `fitshelf-app/src/lib/supabase.ts` adds cleanup for app-side `Test DB Write` rows.
- `fitshelf-app/src/lib/supabase.ts` now reads any existing `avatar_profiles` row before the test and restores it afterward; if none existed, it deletes the temporary avatar test row.

Verification:

```powershell
cd fitshelf-app
npm run typecheck
```

Result: passed.

```powershell
py -m pytest tests/test_fitshelf_backend.py tests/test_fitshelf_tryon.py
```

Result: 10 passed.

```powershell
py -m compileall ai/backend ai/fitshelf_tryon ai/scripts
```

Result: passed.

Live backend smoke on temporary port 8024:

```json
{
  "Health": "ok",
  "ResultBucketExists": true,
  "AssetBucketExists": true,
  "SupabaseUploadOk": true,
  "SupabaseSignedUrlOk": true,
  "SupabaseProfileWriteOk": true,
  "SupabaseProfileReadOk": true,
  "SupabaseProfileDeleteOk": false,
  "PriorityTablesOk": false,
  "StorageError": null,
  "DbError": "person_images write returned 400: {\"code\":\"PGRST204\",\"details\":null,\"hint\":null,\"message\":\"Could not find the 'image_url' column of 'person_images' in the schema cache\"}"
}
```

Expo bundle smoke on temporary port 8104:

```text
HTTP 200, 22,079,222 bytes
```

Secret check:

```powershell
rg "SUPABASE_SERVICE_ROLE_KEY|SERVICE_ROLE" fitshelf-app -n
```

Result: no matches.
## 2026-05-11T12:38 - Read-Only Schema Health Endpoint Proof

Code proof:
- `ai/backend/supabase_store.py` adds `check_supabase_schema()`.
- `ai/backend/app.py` exposes `GET /supabase/schema-health`.
- `tests/test_fitshelf_backend.py` covers the endpoint response shape.
- `ai/supabase/README.md` documents the endpoint and expected result.

Verification:

```powershell
cd fitshelf-app
npm run typecheck
```

Result: passed.

```powershell
py -m pytest tests/test_fitshelf_backend.py tests/test_fitshelf_tryon.py
```

Result: 11 passed.

```powershell
py -m compileall ai/backend ai/fitshelf_tryon ai/scripts
```

Result: passed.

Live schema/backend smoke on temporary port 8025:

```json
{
  "Health": "ok",
  "ResultBucketExists": true,
  "AssetBucketExists": true,
  "SchemaOk": false,
  "SchemaMissing": [
    "person_images: 400 {\"code\":\"42703\",\"details\":null,\"hint\":null,\"message\":\"column person_images.label does not exist\"}",
    "wardrobe_items: 400 {\"code\":\"42703\",\"details\":null,\"hint\":null,\"message\":\"column wardrobe_items.color does not exist\"}",
    "saved_looks: 400 {\"code\":\"42703\",\"details\":null,\"hint\":null,\"message\":\"column saved_looks.tryon_job_id does not exist\"}"
  ],
  "PriorityTablesOk": false,
  "DbError": "person_images write returned 400: {\"code\":\"PGRST204\",\"details\":null,\"hint\":null,\"message\":\"Could not find the 'image_url' column of 'person_images' in the schema cache\"}"
}
```

Expo bundle smoke on temporary port 8105:

```text
HTTP 200, 22,079,222 bytes
```

Secret check:

```powershell
rg "SUPABASE_SERVICE_ROLE_KEY|SERVICE_ROLE" fitshelf-app -n
```

Result: no matches.
## 2026-05-11T12:42 - Exact Schema Missing List Proof

Code proof:
- `ai/backend/supabase_store.py` now checks required schema columns one at a time in `check_supabase_schema()`.

Verification:

```powershell
cd fitshelf-app
npm run typecheck
```

Result: passed.

```powershell
py -m pytest tests/test_fitshelf_backend.py tests/test_fitshelf_tryon.py
```

Result: 11 passed.

```powershell
py -m compileall ai/backend ai/fitshelf_tryon ai/scripts
```

Result: passed.

Live schema/backend smoke on temporary port 8026:

```json
{
  "Health": "ok",
  "ResultBucketExists": true,
  "AssetBucketExists": true,
  "SchemaOk": false,
  "SchemaMissing": [
    "person_images.label",
    "person_images.image_url",
    "wardrobe_items.color",
    "wardrobe_items.favorite",
    "wardrobe_items.image_url",
    "saved_looks.tryon_job_id",
    "saved_looks.result_storage_path",
    "saved_looks.local_result_url"
  ],
  "PriorityTablesOk": false,
  "DbError": "person_images write returned 400: {\"code\":\"PGRST204\",\"details\":null,\"hint\":null,\"message\":\"Could not find the 'image_url' column of 'person_images' in the schema cache\"}"
}
```

Expo bundle smoke on temporary port 8106:

```text
HTTP 200, 22,079,222 bytes
```

Secret check:

```powershell
rg "SUPABASE_SERVICE_ROLE_KEY|SERVICE_ROLE" fitshelf-app -n
```

Result: no matches.
## 2026-05-11T12:46 - In-App Backend Schema Check Proof

Code proof:
- `fitshelf-app/src/lib/tryonApi.ts` exports `getBackendSchemaHealth()`.
- `fitshelf-app/src/components/TryOnPanel.tsx` adds `Test Backend Schema` and displays missing schema entries in the panel error area.
- `fitshelf-app/README.md` documents the action.

Verification:

```powershell
cd fitshelf-app
npm run typecheck
```

Result: passed.

```powershell
py -m pytest tests/test_fitshelf_backend.py tests/test_fitshelf_tryon.py
```

Result: 11 passed.

```powershell
py -m compileall ai/backend ai/fitshelf_tryon ai/scripts
```

Result: passed.

Live schema health on temporary port 8027:

```json
{
  "Health": "ok",
  "SchemaOk": false,
  "SchemaMissing": [
    "person_images.label",
    "person_images.image_url",
    "wardrobe_items.color",
    "wardrobe_items.favorite",
    "wardrobe_items.image_url",
    "saved_looks.tryon_job_id",
    "saved_looks.result_storage_path",
    "saved_looks.local_result_url"
  ]
}
```

Expo bundle smoke on temporary port 8107:

```text
HTTP 200, 22,081,865 bytes
```

Secret check:

```powershell
rg "SUPABASE_SERVICE_ROLE_KEY|SERVICE_ROLE" fitshelf-app -n
```

Result: no matches.
## 2026-05-11T12:50 - PostgREST Schema Cache Reload In Patch Proof

Code proof:
- `ai/supabase/stabilization_patch.sql` ends with `notify pgrst, 'reload schema';`.
- `ai/supabase/schema.sql` ends with `notify pgrst, 'reload schema';`.
- `ai/supabase/README.md` documents that the patch reloads PostgREST schema cache.

Verification:

```powershell
cd fitshelf-app
npm run typecheck
```

Result: passed.

```powershell
py -m pytest tests/test_fitshelf_backend.py tests/test_fitshelf_tryon.py
```

Result: 11 passed.

```powershell
py -m compileall ai/backend ai/fitshelf_tryon ai/scripts
```

Result: passed.

Live schema health on temporary port 8028:

```json
{
  "Health": "ok",
  "SchemaOk": false,
  "SchemaMissing": [
    "person_images.label",
    "person_images.image_url",
    "wardrobe_items.color",
    "wardrobe_items.favorite",
    "wardrobe_items.image_url",
    "saved_looks.tryon_job_id",
    "saved_looks.result_storage_path",
    "saved_looks.local_result_url"
  ]
}
```

Expo bundle smoke on temporary port 8108:

```text
HTTP 200, 22,081,865 bytes
```

Secret check:

```powershell
rg "SUPABASE_SERVICE_ROLE_KEY|SERVICE_ROLE" fitshelf-app -n
```

Result: no matches.
## 2026-05-11T12:53 - Schema Health Patch Hint Proof

Code proof:
- `ai/backend/supabase_store.py` includes `patch_file` in `SupabaseSchemaCheck`.
- `ai/backend/app.py` returns `patch_file` from `/supabase/schema-health`.
- `fitshelf-app/src/lib/tryonApi.ts` includes `patch_file` in `BackendSchemaHealth`.
- `fitshelf-app/src/components/TryOnPanel.tsx` displays the patch path when backend schema check fails.
- `tests/test_fitshelf_backend.py` asserts `patch_file`.

Verification:

```powershell
cd fitshelf-app
npm run typecheck
```

Result: passed.

```powershell
py -m pytest tests/test_fitshelf_backend.py tests/test_fitshelf_tryon.py
```

Result: 11 passed.

```powershell
py -m compileall ai/backend ai/fitshelf_tryon ai/scripts
```

Result: passed.

Live schema health on temporary port 8029:

```json
{
  "Health": "ok",
  "SchemaOk": false,
  "PatchFile": "ai/supabase/stabilization_patch.sql",
  "SchemaMissing": [
    "person_images.label",
    "person_images.image_url",
    "wardrobe_items.color",
    "wardrobe_items.favorite",
    "wardrobe_items.image_url",
    "saved_looks.tryon_job_id",
    "saved_looks.result_storage_path",
    "saved_looks.local_result_url"
  ],
  "Error": "Missing required schema entries. Run ai/supabase/stabilization_patch.sql."
}
```

Expo bundle smoke on temporary port 8109:

```text
HTTP 200, 22,082,056 bytes
```

Secret check:

```powershell
rg "SUPABASE_SERVICE_ROLE_KEY|SERVICE_ROLE" fitshelf-app -n
```

Result: no matches.

Verification:

```powershell
cd fitshelf-app
npm run typecheck
```

Result: passed.

```powershell
py -m pytest tests/test_fitshelf_backend.py tests/test_fitshelf_tryon.py
```

Result: 10 passed.

```powershell
py -m compileall ai/backend ai/fitshelf_tryon ai/scripts
```

Result: passed.

Live backend smoke on temporary port 8018:

```json
{
  "Health": "ok",
  "ResultBucketExists": true,
  "AssetBucketExists": true,
  "SupabaseUploadOk": true,
  "SupabaseSignedUrlOk": true,
  "SupabaseProfileWriteOk": true,
  "SupabaseProfileReadOk": true,
  "SupabaseProfileDeleteOk": true,
  "StorageError": null,
  "DbError": null
}
```

Expo bundle smoke on temporary port 8099:

```text
HTTP 200, 22,072,875 bytes
```

Secret check:

```powershell
rg "SUPABASE_SERVICE_ROLE_KEY|SERVICE_ROLE" fitshelf-app -n
```

Result: no matches.
## 2026-05-11T13:05 - Latest Verification Pointer

Latest verification after the schema-blocked save message:
- `npm run typecheck` passed.
- `py -m pytest tests/test_fitshelf_backend.py tests/test_fitshelf_tryon.py` passed with 11 tests.
- `py -m compileall ai/backend ai/fitshelf_tryon ai/scripts` passed.
- Temporary backend on port 8031 reported schema health `ok=false` with the known missing stabilization columns and `patch_file=ai/supabase/stabilization_patch.sql`.
- Temporary Expo bundle on port 8111 returned HTTP 200 with 22,083,285 bytes.
- `rg "SUPABASE_SERVICE_ROLE_KEY|SERVICE_ROLE" fitshelf-app -n` returned no matches.
- Temporary ports 8031 and 8111 were clear after smoke checks.

Completion audit result:
- Not complete until `ai/supabase/stabilization_patch.sql` is applied and the signed-in physical-device flows are verified.
## 2026-05-11T13:11 - Save Person/Garment Feedback Proof

Code proof:
- `fitshelf-app/src/components/TryOnPanel.tsx` now types `onSavePerson` and `onSaveGarment` as async callbacks.
- `savePersonAsset()` and `saveGarmentAsset()` await the parent save operations and display progress/completion/failure in the Try-On panel.
- `fitshelf-app/App.tsx` now passes the `addMannequin()` and `addClothing()` promises back to Try-On instead of discarding them with `void`.

Verification:
- `npm run typecheck` passed.
- `py -m pytest tests/test_fitshelf_backend.py tests/test_fitshelf_tryon.py` passed with 11 tests.
- `py -m compileall ai/backend ai/fitshelf_tryon ai/scripts` passed.
- Live backend schema health on temporary port 8032: `ok=false`, `patch_file=ai/supabase/stabilization_patch.sql`, missing `person_images.label`, `person_images.image_url`, `wardrobe_items.color`, `wardrobe_items.favorite`, `wardrobe_items.image_url`, `saved_looks.tryon_job_id`, `saved_looks.result_storage_path`, and `saved_looks.local_result_url`.
- Expo bundle smoke on temporary port 8112 returned HTTP 200 with 22,085,035 bytes.
- Secret scan in `fitshelf-app/` returned no service-role matches.
- Temporary ports 8032 and 8112 were clear after checks.

Completion audit result:
- Not complete. Live schema application and signed-in physical-device verification remain required.
## 2026-05-11T13:15 - Save Status Propagation Proof

Code proof:
- `fitshelf-app/App.tsx` returns the final sync message from `addMannequin()` and `addClothing()`.
- `fitshelf-app/src/components/TryOnPanel.tsx` accepts async save callbacks returning a message and renders it after Save Person/Garment.
- Header summary separators were normalized to ASCII.

Verification:
- `npm run typecheck` passed.
- `py -m pytest tests/test_fitshelf_backend.py tests/test_fitshelf_tryon.py` passed with 11 tests.
- `py -m compileall ai/backend ai/fitshelf_tryon ai/scripts` passed.
- Temporary backend on port 8033: `/supabase/schema-health` returned `ok=false`, `patch_file=ai/supabase/stabilization_patch.sql`, and the known missing stabilization columns.
- Temporary Expo bundle on port 8113 returned HTTP 200 with 22,085,661 bytes.
- `rg "SUPABASE_SERVICE_ROLE_KEY|SERVICE_ROLE" fitshelf-app -n` returned no matches.
- Temporary ports 8033 and 8113 were clear after checks.

Completion audit result:
- Not complete until the Supabase SQL patch is applied and the signed-in phone flow proves rows, reloads, GLB rendering, auth redirect, and image fallback.
## 2026-05-11T13:19 - App DB Patch Hint Proof

Code proof:
- `fitshelf-app/src/lib/supabase.ts` defines `stabilizationPatchFile = "ai/supabase/stabilization_patch.sql"`.
- `messageFor()` appends the patch instruction when sanitized Supabase/PostgREST errors mention `schema cache`, `could not find`, or `column`.
- This covers app-side table paths that use the shared sanitizer, including DB write checks and priority persistence errors.

Verification:
- `npm run typecheck` passed.
- `py -m pytest tests/test_fitshelf_backend.py tests/test_fitshelf_tryon.py` passed with 11 tests.
- `py -m compileall ai/backend ai/fitshelf_tryon ai/scripts` passed.
- Temporary backend on port 8034: `/supabase/schema-health` returned `ok=false`, `patch_file=ai/supabase/stabilization_patch.sql`, and the known missing stabilization columns.
- Temporary Expo bundle on port 8114 returned HTTP 200 with 22,086,045 bytes.
- `rg "SUPABASE_SERVICE_ROLE_KEY|SERVICE_ROLE" fitshelf-app -n` returned no matches.
- Temporary ports 8034 and 8114 were clear after checks.

Completion audit result:
- Not complete. The patch hint improves diagnosis, but live schema application and signed-in phone verification remain required.
## 2026-05-11T13:23 - Local-Only Save Message Proof

Code proof:
- `fitshelf-app/App.tsx` now returns `Person image saved to Supabase.` only when `uploaded.storagePath` exists.
- If `uploaded.storagePath` is missing, Save Person returns `Person image saved locally only. Sign in, run Test Asset Upload, then save again for Supabase rows.`
- Garment save uses the same Supabase/local-only distinction.

Verification:
- `npm run typecheck` passed.
- `py -m pytest tests/test_fitshelf_backend.py tests/test_fitshelf_tryon.py` passed with 11 tests.
- `py -m compileall ai/backend ai/fitshelf_tryon ai/scripts` passed.
- Temporary backend on port 8035: `/supabase/schema-health` returned `ok=false`, `patch_file=ai/supabase/stabilization_patch.sql`, and the known missing stabilization columns.
- Temporary Expo bundle on port 8115 returned HTTP 200 with 22,086,318 bytes.
- `rg "SUPABASE_SERVICE_ROLE_KEY|SERVICE_ROLE" fitshelf-app -n` returned no matches.
- Temporary ports 8035 and 8115 were clear after checks.

Completion audit result:
- Not complete. The app now avoids claiming Supabase persistence when only local storage was used, but the live SQL patch and phone proof are still required.
## 2026-05-11T13:26 - Manual Phone Checklist Proof

Code/doc proof:
- `fitshelf-app/README.md` now lists the ordered phone gate: patch SQL, `/supabase/schema-health`, `/supabase/db-health`, `Test Backend Schema`, `Test DB Write`, `Test Asset Upload`, Save Person/Garment, Preview, Save Look, restart/reload.
- `ai/supabase/README.md` now documents expected `/supabase/db-health` output with `priority_tables_ok=true`.
- `ai/supabase/README.md` now includes a physical phone persistence checklist with `person_images`, `wardrobe_items`, `tryon_jobs`, `saved_looks`, and avatar GLB verification.

Verification:
- `npm run typecheck` passed.
- `py -m pytest tests/test_fitshelf_backend.py tests/test_fitshelf_tryon.py` passed with 11 tests.
- `py -m compileall ai/backend ai/fitshelf_tryon ai/scripts` passed.
- Temporary backend on port 8036: `/supabase/schema-health` returned `ok=false`, `patch_file=ai/supabase/stabilization_patch.sql`, and the known missing stabilization columns.
- Temporary Expo bundle on port 8116 returned HTTP 200 with 22,086,318 bytes.
- `rg "SUPABASE_SERVICE_ROLE_KEY|SERVICE_ROLE" fitshelf-app -n` returned no matches.
- Temporary ports 8036 and 8116 were clear after checks.

Completion audit result:
- Not complete. The manual checklist is clearer, but the SQL patch and phone proof are still required.
## 2026-05-11T13:31 - In-App Backend DB Health Gate Proof

Code proof:
- `fitshelf-app/src/lib/tryonApi.ts` adds `BackendDbHealth` and `getBackendDbHealth()`.
- `fitshelf-app/src/components/TryOnPanel.tsx` adds `Test Backend DB`, calls `/supabase/db-health`, requires `priority_tables_ok=true`, and blocks save actions on failure.
- `fitshelf-app/README.md` and `ai/supabase/README.md` include `Test Backend DB` in the manual phone flow.

Verification:
- `npm run typecheck` passed.
- `py -m pytest tests/test_fitshelf_backend.py tests/test_fitshelf_tryon.py` passed with 11 tests.
- `py -m compileall ai/backend ai/fitshelf_tryon ai/scripts` passed.
- Temporary backend on port 8037 returned:
  - `/supabase/schema-health`: `ok=false`, patch file `ai/supabase/stabilization_patch.sql`, missing the known stabilization columns.
  - `/supabase/db-health`: `priority_tables_ok=false`, error `person_images write returned 400` because `person_images.image_url` is missing from the schema cache.
- Temporary Expo bundle on port 8117 returned HTTP 200 with 22,089,361 bytes.
- `rg "SUPABASE_SERVICE_ROLE_KEY|SERVICE_ROLE" fitshelf-app -n` returned no matches.
- Temporary ports 8037 and 8117 were clear after checks.

Completion audit result:
- Not complete. Backend schema and DB health are now visible on phone, but both still fail until the live SQL patch is applied.
## 2026-05-11T13:35 - Backend DB Failure Contract Proof

Code proof:
- `tests/test_fitshelf_backend.py` now includes `test_supabase_db_health_endpoint_reports_priority_table_failure`.
- The test covers the response contract used by `Test Backend DB`: `priority_tables_ok=false` plus missing `person_images.image_url` context.

Verification:
- `npm run typecheck` passed.
- `py -m pytest tests/test_fitshelf_backend.py tests/test_fitshelf_tryon.py` passed with 12 tests.
- `py -m compileall ai/backend ai/fitshelf_tryon ai/scripts` passed.
- Temporary backend on port 8038 returned:
  - `/supabase/schema-health`: `ok=false`, patch file `ai/supabase/stabilization_patch.sql`, missing the known stabilization columns.
  - `/supabase/db-health`: `priority_tables_ok=false`, error `person_images write returned 400` because `person_images.image_url` is missing from the schema cache.
- Temporary Expo bundle on port 8118 returned HTTP 200 with 22,089,361 bytes.
- `rg "SUPABASE_SERVICE_ROLE_KEY|SERVICE_ROLE" fitshelf-app -n` returned no matches.
- Temporary ports 8038 and 8118 were clear after checks.

Completion audit result:
- Not complete. Contract coverage improved, but live SQL patch application and signed-in phone proof remain required.
## 2026-05-11T13:39 - DB Health Patch File Proof

Code proof:
- `ai/backend/supabase_store.py` adds `patch_file` to `SupabaseDbCheck`.
- `ai/backend/app.py` includes `patch_file` in `/supabase/db-health`.
- `fitshelf-app/src/lib/tryonApi.ts` includes optional `patch_file` on `BackendDbHealth`.
- `fitshelf-app/src/components/TryOnPanel.tsx` uses the DB health response `patch_file` in `Test Backend DB` failure messages.
- `tests/test_fitshelf_backend.py` asserts `patch_file` is present for DB health success and failure responses.

Verification:
- `npm run typecheck` passed.
- `py -m pytest tests/test_fitshelf_backend.py tests/test_fitshelf_tryon.py` passed with 12 tests.
- `py -m compileall ai/backend ai/fitshelf_tryon ai/scripts` passed.
- Temporary backend on port 8039 returned:
  - `/supabase/schema-health`: `ok=false`, `patch_file=ai/supabase/stabilization_patch.sql`.
  - `/supabase/db-health`: `priority_tables_ok=false`, `patch_file=ai/supabase/stabilization_patch.sql`, error on missing `person_images.image_url`.
- Temporary Expo bundle on port 8119 returned HTTP 200 with 22,089,490 bytes.
- `rg "SUPABASE_SERVICE_ROLE_KEY|SERVICE_ROLE" fitshelf-app -n` returned no matches.
- Temporary ports 8039 and 8119 were clear after checks.

Completion audit result:
- Not complete. DB health now carries exact remediation metadata, but the live patch and phone proof remain required.
## 2026-05-11T13:42 - DB Health Docs Patch File Proof

Code/doc proof:
- `ai/supabase/README.md` expected `/supabase/db-health` JSON now includes `patch_file`.

Verification:
- `npm run typecheck` passed.
- `py -m pytest tests/test_fitshelf_backend.py tests/test_fitshelf_tryon.py` passed with 12 tests.
- `py -m compileall ai/backend ai/fitshelf_tryon ai/scripts` passed.
- Temporary backend on port 8040 returned:
  - `/supabase/schema-health`: `ok=false`, `patch_file=ai/supabase/stabilization_patch.sql`.
  - `/supabase/db-health`: `priority_tables_ok=false`, `patch_file=ai/supabase/stabilization_patch.sql`, error on missing `person_images.image_url`.
- Temporary Expo bundle on port 8120 returned HTTP 200 with 22,089,490 bytes.
- `rg "SUPABASE_SERVICE_ROLE_KEY|SERVICE_ROLE" fitshelf-app -n` returned no matches.
- Temporary ports 8040 and 8120 were clear after checks.

Completion audit result:
- Not complete. Documentation is aligned, but the live patch and phone proof remain required.
## 2026-05-11T13:46 - Avatar Contract Static Test Proof

Code proof:
- `tests/test_fitshelf_app_static.py` verifies Avatar panel GLB loading contract, gesture handlers, numeric inputs next to sliders, unsupported morph note, and absence of `CapsuleGeometry`.

Verification:
- `npm run typecheck` passed.
- `py -m pytest tests/test_fitshelf_backend.py tests/test_fitshelf_tryon.py tests/test_fitshelf_app_static.py` passed with 13 tests.
- `py -m compileall ai/backend ai/fitshelf_tryon ai/scripts` passed.
- Temporary backend on port 8041 returned:
  - `/supabase/schema-health`: `ok=false`, `patch_file=ai/supabase/stabilization_patch.sql`.
  - `/supabase/db-health`: `priority_tables_ok=false`, `patch_file=ai/supabase/stabilization_patch.sql`, error on missing `person_images.image_url`.
- Temporary Expo bundle on port 8121 returned HTTP 200 with 22,089,490 bytes.
- `rg "SUPABASE_SERVICE_ROLE_KEY|SERVICE_ROLE" fitshelf-app -n` returned no matches.
- Temporary ports 8041 and 8121 were clear after checks.

Completion audit result:
- Not complete. Avatar contract coverage improved, but physical-device GLB rendering and the live Supabase patch still require manual proof.
## 2026-05-11T13:50 - Try-On Contract Static Test Proof

Code proof:
- `tests/test_fitshelf_app_static.py` now verifies the Try-On panel persistence and result-image contract.
- Covered strings/API hooks include Save Person/Garment/Look, Test Backend Schema/DB, schema-failed save blocking, `resultStoragePath`, `supabase_storage_path`, signed URL refresh, backend proxy fallback, local result fallback, cache-busting, and image error recovery.

Verification:
- `npm run typecheck` passed.
- `py -m pytest tests/test_fitshelf_backend.py tests/test_fitshelf_tryon.py tests/test_fitshelf_app_static.py` passed with 14 tests.
- `py -m compileall ai/backend ai/fitshelf_tryon ai/scripts` passed.
- Temporary backend on port 8042 returned:
  - `/supabase/schema-health`: `ok=false`, `patch_file=ai/supabase/stabilization_patch.sql`.
  - `/supabase/db-health`: `priority_tables_ok=false`, `patch_file=ai/supabase/stabilization_patch.sql`, error on missing `person_images.image_url`.
- Temporary Expo bundle on port 8122 returned HTTP 200 with 22,089,490 bytes.
- `rg "SUPABASE_SERVICE_ROLE_KEY|SERVICE_ROLE" fitshelf-app -n` returned no matches.
- Temporary ports 8042 and 8122 were clear after checks.

Completion audit result:
- Not complete. Try-On contract coverage improved, but live Supabase patch application and physical phone proof remain required.
## 2026-05-11T13:53 - App Persistence/Auth/Debug Contract Static Test Proof

Code proof:
- `tests/test_fitshelf_app_static.py` now verifies the app-side Supabase persistence/auth/debug contract.
- Covered hooks include visible debug buttons, `handleSupabaseAuthCallback`, initial URL restore, link-event handling, Try-On save callback wiring, priority table references, `user_id` writes, sanitized DB errors, patch hint, and absence of service-role key strings in Expo sources.

Verification:
- `npm run typecheck` passed.
- `py -m pytest tests/test_fitshelf_backend.py tests/test_fitshelf_tryon.py tests/test_fitshelf_app_static.py` passed with 15 tests.
- `py -m compileall ai/backend ai/fitshelf_tryon ai/scripts` passed.
- Temporary backend on port 8043 returned:
  - `/supabase/schema-health`: `ok=false`, `patch_file=ai/supabase/stabilization_patch.sql`.
  - `/supabase/db-health`: `priority_tables_ok=false`, `patch_file=ai/supabase/stabilization_patch.sql`, error on missing `person_images.image_url`.
- Temporary Expo bundle on port 8123 returned HTTP 200 with 22,089,490 bytes.
- `rg "SUPABASE_SERVICE_ROLE_KEY|SERVICE_ROLE" fitshelf-app -n` returned no matches.
- Temporary ports 8043 and 8123 were clear after checks.

Completion audit result:
- Not complete. App-side contract coverage improved, but live Supabase patch application and physical phone proof remain required.
## 2026-05-11T14:00 - Supabase Patch Contract Static Test Proof

Code proof:
- `tests/test_fitshelf_app_static.py` now verifies the Supabase stabilization SQL patch contract.
- Covered patch requirements include `person_images`, `wardrobe_items`, and `saved_looks` column alterations; `tryon-results` and `fitshelf-assets` buckets; storage policy/auth path restriction; and `notify pgrst, 'reload schema'`.

Verification:
- `npm run typecheck` passed.
- `py -m pytest tests/test_fitshelf_backend.py tests/test_fitshelf_tryon.py tests/test_fitshelf_app_static.py` passed with 16 tests.
- `py -m compileall ai/backend ai/fitshelf_tryon ai/scripts` passed.
- Temporary backend on port 8044 returned:
  - `/supabase/schema-health`: `ok=false`, `patch_file=ai/supabase/stabilization_patch.sql`.
  - `/supabase/db-health`: `priority_tables_ok=false`, `patch_file=ai/supabase/stabilization_patch.sql`, error on missing `person_images.image_url`.
- Temporary Expo bundle on port 8124 returned HTTP 200 with 22,089,490 bytes.
- `rg "SUPABASE_SERVICE_ROLE_KEY|SERVICE_ROLE" fitshelf-app -n` returned no matches.

Completion audit result:
- Not complete. The SQL patch file is now guarded by regression coverage, but the live Supabase project still needs the patch applied and the phone checklist run.
## 2026-05-11T14:04 - User-Scoped Reload Proof

Code proof:
- `fitshelf-app/src/lib/storage.ts` now scopes Supabase reload queries for `person_images`, `wardrobe_items`, and `saved_looks` with `.eq("user_id", ...)`.
- `tests/test_fitshelf_app_static.py` includes `test_storage_reload_queries_are_user_scoped`.

Prompt-to-artifact audit:
- Clear Save Person/Garment/Look controls: present in `TryOnPanel.tsx`; covered by static test.
- Priority tables write paths with `user_id`: present for `person_images`, `wardrobe_items`, `saved_looks`, `avatar_profiles`, `tryon_jobs`; covered by static/backend checks.
- Restart/reload reads: now explicitly scoped by `user_id` for person images, wardrobe items, and saved looks.
- Sanitized DB/RLS errors: present in app-side Supabase/storage helpers.
- Result image durability/fallback: storage path, signed refresh, backend proxy, local fallback, cache-busting, and image error recovery are present.
- Avatar GLB: `useGLTF`, `default-mannequin.glb`, gesture handlers, numeric inputs, and unsupported morph disclosure are present.
- Auth redirect: redirect URL display, initial URL handling, link-event handling, code/token exchange, and session restore are present.
- Manual/live gaps: Supabase SQL patch has not been applied; physical phone proof is still missing.

Verification:
- `npm run typecheck` passed.
- `py -m pytest tests/test_fitshelf_backend.py tests/test_fitshelf_tryon.py tests/test_fitshelf_app_static.py` passed with 17 tests.
- `py -m compileall ai/backend ai/fitshelf_tryon ai/scripts` passed.
- Temporary backend on port 8045 returned:
  - `/health`: `ok`.
  - `/supabase/schema-health`: `ok=false`, `patch_file=ai/supabase/stabilization_patch.sql`, missing `person_images.label`, `person_images.image_url`, `wardrobe_items.color`, `wardrobe_items.favorite`, `wardrobe_items.image_url`, `saved_looks.tryon_job_id`, `saved_looks.result_storage_path`, `saved_looks.local_result_url`.
  - `/supabase/db-health`: `priority_tables_ok=false`, `patch_file=ai/supabase/stabilization_patch.sql`, error on missing `person_images.image_url`.
- Temporary Expo bundle on port 8125 returned HTTP 200 with 22,089,572 bytes.
- `rg "SUPABASE_SERVICE_ROLE_KEY|SERVICE_ROLE" fitshelf-app -n` returned no matches.

Completion audit result:
- Not complete. Local code coverage is stronger, but live Supabase patch application and physical-device verification remain required.
## 2026-05-11T14:09 - Manual Auth Callback Recovery Proof

Code proof:
- `fitshelf-app/src/components/AuthPanel.tsx` now includes `Paste verification callback URL` and `Restore callback`.
- The recovery action calls `handleSupabaseAuthCallback(url)`, then creates/loads the profile and enters Supabase session mode.
- `tests/test_fitshelf_app_static.py` verifies the visible recovery UI and callback handler wiring.
- `fitshelf-app/README.md` and `ai/supabase/README.md` document what to do when the phone browser opens the callback instead of returning to Expo.

Prompt-to-artifact audit:
- Auth redirect handling: app handles initial URL, link events, code callbacks, token callbacks, and now manual pasted callback URLs.
- Persistence: priority table write/reload paths exist and are covered, but live rows cannot be proven until the SQL patch is applied.
- Result images: storage path, signed refresh, proxy fallback, local fallback, cache-busting, and retry path exist; phone proof remains required.
- Avatar: GLB path, autoscale/centering, gestures, numeric inputs, and unsupported morph disclosure exist; phone proof remains required.
- Required commands: typecheck, focused pytest, compile, backend health/Supabase checks, Expo bundle smoke, and secret scan were run.

Verification:
- `npm run typecheck` passed.
- `py -m pytest tests/test_fitshelf_backend.py tests/test_fitshelf_tryon.py tests/test_fitshelf_app_static.py` passed with 17 tests.
- `py -m compileall ai/backend ai/fitshelf_tryon ai/scripts` passed.
- Temporary backend on port 8046 returned:
  - `/health`: `ok`.
  - `/supabase/schema-health`: `ok=false`, `patch_file=ai/supabase/stabilization_patch.sql`, with the known missing stabilization columns.
  - `/supabase/db-health`: `priority_tables_ok=false`, `patch_file=ai/supabase/stabilization_patch.sql`, with the known `person_images.image_url` schema-cache error.
- Temporary Expo bundle on port 8126 returned HTTP 200 with 22,093,205 bytes.
- `rg "SUPABASE_SERVICE_ROLE_KEY|SERVICE_ROLE" fitshelf-app -n` returned no matches.

Completion audit result:
- Not complete. Auth recovery is improved, but live Supabase patch application and physical phone proof remain required.
## 2026-05-11T14:13 - User-Scoped DB Debug Probe Proof

Code proof:
- `fitshelf-app/src/lib/supabase.ts` now adds `.eq("user_id", profile.userId)` to DB-write probe cleanup/read/delete checks for `person_images`, `wardrobe_items`, `tryon_jobs`, and `saved_looks`.
- `tests/test_fitshelf_app_static.py` includes `test_app_db_write_probe_reads_and_deletes_are_user_scoped`.

Prompt-to-artifact audit:
- Visible DB/sync debug action: present in the app header as `Test DB Write`.
- Correct `user_id`: inserts already include `user_id`; the probe now also verifies reads/deletes through authenticated `user_id` filters.
- Live rows: not proven yet because the live schema is missing stabilization columns.
- Other priorities: result image, avatar GLB, auth callback, and docs have code-level coverage but still need phone proof.

Verification:
- `npm run typecheck` passed.
- `py -m pytest tests/test_fitshelf_backend.py tests/test_fitshelf_tryon.py tests/test_fitshelf_app_static.py` passed with 18 tests.
- `py -m compileall ai/backend ai/fitshelf_tryon ai/scripts` passed.
- Temporary backend on port 8047 returned:
  - `/health`: `ok`.
  - `/supabase/schema-health`: `ok=false`, `patch_file=ai/supabase/stabilization_patch.sql`, with the known missing stabilization columns.
  - `/supabase/db-health`: `priority_tables_ok=false`, `patch_file=ai/supabase/stabilization_patch.sql`, with the known `person_images.image_url` schema-cache error.
- Temporary Expo bundle on port 8127 returned HTTP 200 with 22,093,565 bytes.
- `rg "SUPABASE_SERVICE_ROLE_KEY|SERVICE_ROLE" fitshelf-app -n` returned no matches.

Completion audit result:
- Not complete. The app-side DB probe is stricter, but live Supabase patch application and physical phone proof remain required.
## 2026-05-11T14:17 - Backend DB Health User Scope Proof

Code proof:
- `ai/backend/supabase_store.py` now includes `user_id=eq.{test_id}` in `/supabase/db-health` priority-table read/delete/cleanup queries for `person_images`, `wardrobe_items`, `tryon_jobs`, and `saved_looks`.
- `tests/test_fitshelf_backend.py` includes `test_supabase_db_health_probe_scopes_priority_rows_by_user`.

Prompt-to-artifact audit:
- Backend DB gate: `/supabase/db-health` still exercises `profiles`, `person_images`, `wardrobe_items`, `tryon_jobs`, `saved_looks`, and `avatar_profiles`.
- Correct user ownership: the backend probe writes `user_id` and now verifies priority rows using `user_id` filters.
- Live rows: not proven because the live schema is still missing stabilization columns.
- Remaining phone-only proof: persistence/reload, result image fallback, GLB render/gesture behavior, and auth callback behavior.

Verification:
- `npm run typecheck` passed.
- `py -m pytest tests/test_fitshelf_backend.py tests/test_fitshelf_tryon.py tests/test_fitshelf_app_static.py` passed with 19 tests.
- `py -m compileall ai/backend ai/fitshelf_tryon ai/scripts` passed.
- Temporary backend on port 8048 returned:
  - `/health`: `ok`.
  - `/supabase/schema-health`: `ok=false`, `patch_file=ai/supabase/stabilization_patch.sql`, with the known missing stabilization columns.
  - `/supabase/db-health`: `priority_tables_ok=false`, `patch_file=ai/supabase/stabilization_patch.sql`, with the known `person_images.image_url` schema-cache error.
- Temporary Expo bundle on port 8128 returned HTTP 200 with 22,093,565 bytes.
- `rg "SUPABASE_SERVICE_ROLE_KEY|SERVICE_ROLE" fitshelf-app -n` returned no matches.

Completion audit result:
- Not complete. Backend DB health is stricter, but live Supabase patch application and physical phone proof remain required.
## 2026-05-11T14:20 - GLB Asset Contract Guard Proof

Code proof:
- `tests/test_fitshelf_app_static.py` now includes `test_default_avatar_asset_is_real_glb`.
- The test verifies `fitshelf-app/assets/avatar/default-mannequin.glb` starts with the `glTF` binary magic and is nontrivial in size.

Prompt-to-artifact audit:
- Real GLB avatar: code uses `useGLTF`, the app references `default-mannequin.glb`, and the asset is now verified as a binary GLB file.
- Procedural fallback: still present only behind GLB failure handling.
- Physical proof gap: device GLB rendering, centering, gestures, and controls still need phone verification.
- Persistence proof gap: live Supabase patch is still unapplied.

Verification:
- `npm run typecheck` passed.
- `py -m pytest tests/test_fitshelf_backend.py tests/test_fitshelf_tryon.py tests/test_fitshelf_app_static.py` passed with 20 tests.
- `py -m compileall ai/backend ai/fitshelf_tryon ai/scripts` passed.
- Temporary backend on port 8049 returned:
  - `/health`: `ok`.
  - `/supabase/schema-health`: `ok=false`, `patch_file=ai/supabase/stabilization_patch.sql`, with the known missing stabilization columns.
  - `/supabase/db-health`: `priority_tables_ok=false`, `patch_file=ai/supabase/stabilization_patch.sql`, with the known `person_images.image_url` schema-cache error.
- Temporary Expo bundle on port 8129 returned HTTP 200 with 22,093,565 bytes.
- `rg "SUPABASE_SERVICE_ROLE_KEY|SERVICE_ROLE" fitshelf-app -n` returned no matches.

Completion audit result:
- Not complete. GLB asset coverage is stronger, but live Supabase patch application and physical phone proof remain required.
## 2026-05-11T14:23 - GLB Finite Geometry Guard Proof

Code proof:
- `tests/test_fitshelf_app_static.py` now parses `fitshelf-app/assets/avatar/default-mannequin.glb`.
- The test verifies GLB v2 header length, extracts the JSON chunk, finds mesh `POSITION` accessors, and asserts accessor `min`/`max` values are finite.

Prompt-to-artifact audit:
- NaN geometry: covered for bundled asset accessor bounds.
- Real GLB avatar: covered by `useGLTF`, asset reference, binary GLB magic, and finite geometry metadata.
- Physical proof gap: device rendering can still fail due to Expo/R3F runtime behavior and must be tested on the phone.
- Persistence proof gap: live Supabase patch is still unapplied.

Verification:
- `npm run typecheck` passed.
- `py -m pytest tests/test_fitshelf_backend.py tests/test_fitshelf_tryon.py tests/test_fitshelf_app_static.py` passed with 20 tests.
- `py -m compileall ai/backend ai/fitshelf_tryon ai/scripts` passed.
- Temporary backend on port 8050 returned:
  - `/health`: `ok`.
  - `/supabase/schema-health`: `ok=false`, `patch_file=ai/supabase/stabilization_patch.sql`, with the known missing stabilization columns.
  - `/supabase/db-health`: `priority_tables_ok=false`, `patch_file=ai/supabase/stabilization_patch.sql`, with the known `person_images.image_url` schema-cache error.
- Temporary Expo bundle on port 8130 returned HTTP 200 with 22,093,565 bytes.
- `rg "SUPABASE_SERVICE_ROLE_KEY|SERVICE_ROLE" fitshelf-app -n` returned no matches.

Completion audit result:
- Not complete. GLB geometry coverage is stronger, but live Supabase patch application and physical phone proof remain required.
## 2026-05-11T14:27 - Expo GLB Runtime Config Guard Proof

Code proof:
- `tests/test_fitshelf_app_static.py` now includes `test_expo_avatar_glb_runtime_configuration_contract`.
- The test verifies R3F/Drei/Three/Expo GL/Expo Asset dependencies, Metro `glb`/`gltf` asset extensions, Metro `mjs` source extension, and the `expo-asset` plugin.

Prompt-to-artifact audit:
- GLB load path: guarded by `useGLTF`, model asset reference, valid GLB file tests, finite bounds tests, and Expo/Metro config tests.
- Physical proof gap: phone must still prove GLB rendering instead of fallback, plus gestures and controls.
- Persistence proof gap: live Supabase patch is still unapplied.

Verification:
- `npm run typecheck` passed.
- `py -m pytest tests/test_fitshelf_backend.py tests/test_fitshelf_tryon.py tests/test_fitshelf_app_static.py` passed with 21 tests.
- `py -m compileall ai/backend ai/fitshelf_tryon ai/scripts` passed.
- Temporary backend on port 8051 returned:
  - `/health`: `ok`.
  - `/supabase/schema-health`: `ok=false`, `patch_file=ai/supabase/stabilization_patch.sql`, with the known missing stabilization columns.
  - `/supabase/db-health`: `priority_tables_ok=false`, `patch_file=ai/supabase/stabilization_patch.sql`, with the known `person_images.image_url` schema-cache error.
- Temporary Expo bundle on port 8131 returned HTTP 200 with 22,093,565 bytes.
- `rg "SUPABASE_SERVICE_ROLE_KEY|SERVICE_ROLE" fitshelf-app -n` returned no matches.

Completion audit result:
- Not complete. Expo GLB config coverage is stronger, but live Supabase patch application and physical phone proof remain required.
## 2026-05-11T14:30 - Production Save User ID Contract Proof

Code proof:
- `tests/test_fitshelf_app_static.py` now includes `test_production_supabase_save_payloads_include_user_id`.
- The test inspects production save functions in `fitshelf-app/src/lib/storage.ts` and verifies `user_id` payloads for `saveMannequins`, `saveClothing`, `saveSavedLooks`, `saveTryOnJobRecord`, and `saveAvatarMeasurements`.

Prompt-to-artifact audit:
- Every production insert/upsert for the priority persistence tables has a guarded `user_id` payload.
- App and backend debug probes are also user-scoped.
- Live row proof remains blocked by the missing Supabase stabilization columns.

Verification:
- `npm run typecheck` passed.
- `py -m pytest tests/test_fitshelf_backend.py tests/test_fitshelf_tryon.py tests/test_fitshelf_app_static.py` passed with 22 tests.
- `py -m compileall ai/backend ai/fitshelf_tryon ai/scripts` passed.
- Temporary backend on port 8052 returned:
  - `/health`: `ok`.
  - `/supabase/schema-health`: `ok=false`, `patch_file=ai/supabase/stabilization_patch.sql`, with the known missing stabilization columns.
  - `/supabase/db-health`: `priority_tables_ok=false`, `patch_file=ai/supabase/stabilization_patch.sql`, with the known `person_images.image_url` schema-cache error.
- Temporary Expo bundle on port 8132 returned HTTP 200 with 22,093,565 bytes.
- `rg "SUPABASE_SERVICE_ROLE_KEY|SERVICE_ROLE" fitshelf-app -n` returned no matches.

Completion audit result:
- Not complete. Production save user ownership is guarded, but live Supabase patch application and physical phone proof remain required.
## 2026-05-11T14:33 - Saved Look Durable Field Contract Proof

Code proof:
- `tests/test_fitshelf_app_static.py` now includes `test_saved_look_persistence_writes_durable_result_fields`.
- The test verifies `saveSavedLooks` writes `tryon_job_id`, `result_storage_path`, `local_result_url`, and `result_url`, and uses the app model fields `resultStoragePath` and `localResultUrl`.

Prompt-to-artifact audit:
- Durable result path: covered in saved-look persistence.
- Signed URL refresh and fallback paths: covered by Try-On static contract.
- Live image proof: still requires physical-device saved-look open/reload testing.
- Live persistence proof: still blocked by missing Supabase stabilization columns.

Verification:
- `npm run typecheck` passed.
- `py -m pytest tests/test_fitshelf_backend.py tests/test_fitshelf_tryon.py tests/test_fitshelf_app_static.py` passed with 23 tests.
- `py -m compileall ai/backend ai/fitshelf_tryon ai/scripts` passed.
- Temporary backend on port 8053 returned:
  - `/health`: `ok`.
  - `/supabase/schema-health`: `ok=false`, `patch_file=ai/supabase/stabilization_patch.sql`, with the known missing stabilization columns.
  - `/supabase/db-health`: `priority_tables_ok=false`, `patch_file=ai/supabase/stabilization_patch.sql`, with the known `person_images.image_url` schema-cache error.
- Temporary Expo bundle on port 8133 returned HTTP 200 with 22,093,565 bytes.
- `rg "SUPABASE_SERVICE_ROLE_KEY|SERVICE_ROLE" fitshelf-app -n` returned no matches.

Completion audit result:
- Not complete. Saved-look durable fields are guarded, but live Supabase patch application and physical phone proof remain required.
## 2026-05-11T14:37 - Manual Drafts Versus Saved Looks Guard Proof

Code proof:
- `tests/test_fitshelf_app_static.py` now includes `test_manual_outfit_builder_is_separate_from_supabase_saved_looks`.
- The test verifies the top-level sections include `manual`, not `outfits`; the manual screen says drafts stay on device; `SavedOutfits` is labeled `Manual Drafts`; and Try-On owns `Saved Looks`.

Prompt-to-artifact audit:
- Stale outfits screen: guarded as a local-only manual builder.
- Supabase generated results: guarded as Try-On `Saved Looks`.
- Live proof gap: still requires physical-device Save Look, restart/reload, and row verification after the SQL patch.

Verification:
- `npm run typecheck` passed.
- `py -m pytest tests/test_fitshelf_backend.py tests/test_fitshelf_tryon.py tests/test_fitshelf_app_static.py` passed with 24 tests.
- `py -m compileall ai/backend ai/fitshelf_tryon ai/scripts` passed.
- Temporary backend on port 8054 returned:
  - `/health`: `ok`.
  - `/supabase/schema-health`: `ok=false`, `patch_file=ai/supabase/stabilization_patch.sql`, with the known missing stabilization columns.
  - `/supabase/db-health`: `priority_tables_ok=false`, `patch_file=ai/supabase/stabilization_patch.sql`, with the known `person_images.image_url` schema-cache error.
- Temporary Expo bundle on port 8134 returned HTTP 200 with 22,093,565 bytes.
- `rg "SUPABASE_SERVICE_ROLE_KEY|SERVICE_ROLE" fitshelf-app -n` returned no matches.

Completion audit result:
- Not complete. Manual/Saved Looks separation is guarded, but live Supabase patch application and physical phone proof remain required.
## 2026-05-11T14:40 - Supabase Success Message Guard Proof

Code proof:
- `tests/test_fitshelf_app_static.py` now includes `test_save_person_and_garment_supabase_success_requires_storage_path`.
- The test verifies `addMannequin` and `addClothing` gate `Person image saved to Supabase.` and `Garment saved to Supabase.` behind `uploaded.storagePath`, and keep the local-only fallback messages.

Prompt-to-artifact audit:
- Stop silently masking DB/storage failures: save messages distinguish Supabase success from local-only fallback.
- Clear Save Person/Garment flow: buttons and messages are present and covered.
- Live proof gap: real Supabase rows still require the patch and phone test.

Verification:
- `npm run typecheck` passed.
- `py -m pytest tests/test_fitshelf_backend.py tests/test_fitshelf_tryon.py tests/test_fitshelf_app_static.py` passed with 25 tests.
- `py -m compileall ai/backend ai/fitshelf_tryon ai/scripts` passed.
- Temporary backend on port 8055 returned:
  - `/health`: `ok`.
  - `/supabase/schema-health`: `ok=false`, `patch_file=ai/supabase/stabilization_patch.sql`, with the known missing stabilization columns.
  - `/supabase/db-health`: `priority_tables_ok=false`, `patch_file=ai/supabase/stabilization_patch.sql`, with the known `person_images.image_url` schema-cache error.
- Temporary Expo bundle on port 8135 returned HTTP 200 with 22,093,565 bytes.
- `rg "SUPABASE_SERVICE_ROLE_KEY|SERVICE_ROLE" fitshelf-app -n` returned no matches.

Completion audit result:
- Not complete. Save-message semantics are guarded, but live Supabase patch application and physical phone proof remain required.
## 2026-05-11T14:44 - Signed URL Proxy Response Guard Proof

Code proof:
- `tests/test_fitshelf_backend.py` now asserts `/supabase/sign` returns `supabase_proxy_url` ending in `/supabase/object?storage_path=...`.
- The app already consumes that field through `refreshSupabaseSignedUrl`, `withProxyUrl`, and image error fallback paths.

Prompt-to-artifact audit:
- Backend signed URL refresh: covered.
- Backend proxy fallback URL: now covered.
- Physical proof gap: phone still needs to prove image fallback when signed URL rendering fails.
- Live persistence proof gap: Supabase patch is still unapplied.

Verification:
- `npm run typecheck` passed.
- `py -m pytest tests/test_fitshelf_backend.py tests/test_fitshelf_tryon.py tests/test_fitshelf_app_static.py` passed with 25 tests.
- `py -m compileall ai/backend ai/fitshelf_tryon ai/scripts` passed.
- Temporary backend on port 8056 returned:
  - `/health`: `ok`.
  - `/supabase/schema-health`: `ok=false`, `patch_file=ai/supabase/stabilization_patch.sql`, with the known missing stabilization columns.
  - `/supabase/db-health`: `priority_tables_ok=false`, `patch_file=ai/supabase/stabilization_patch.sql`, with the known `person_images.image_url` schema-cache error.
- Temporary Expo bundle on port 8136 returned HTTP 200 with 22,093,565 bytes.
- `rg "SUPABASE_SERVICE_ROLE_KEY|SERVICE_ROLE" fitshelf-app -n` returned no matches.

Completion audit result:
- Not complete. Proxy response coverage is stronger, but live Supabase patch application and physical phone proof remain required.
## 2026-05-11T14:48 - Proxy Storage Path Encoding Proof

Code proof:
- `ai/backend/app.py` now builds `supabase_proxy_url` with `quote(cleaned, safe='')`.
- `tests/test_fitshelf_backend.py` includes `test_supabase_sign_endpoint_encodes_proxy_storage_path`.

Prompt-to-artifact audit:
- Backend proxy fallback URL: present and encoded.
- Backend signed URL refresh: still returns `supabase_result_url` and `result_url`.
- Physical proof gap: phone still needs to prove proxy fallback displays the image when signed URL rendering fails.
- Live persistence proof gap: Supabase patch is still unapplied.

Verification:
- `npm run typecheck` passed.
- `py -m pytest tests/test_fitshelf_backend.py tests/test_fitshelf_tryon.py tests/test_fitshelf_app_static.py` passed with 26 tests.
- `py -m compileall ai/backend ai/fitshelf_tryon ai/scripts` passed.
- Temporary backend on port 8057 returned:
  - `/health`: `ok`.
  - `/supabase/schema-health`: `ok=false`, `patch_file=ai/supabase/stabilization_patch.sql`, with the known missing stabilization columns.
  - `/supabase/db-health`: `priority_tables_ok=false`, `patch_file=ai/supabase/stabilization_patch.sql`, with the known `person_images.image_url` schema-cache error.
- Temporary Expo bundle on port 8137 returned HTTP 200 with 22,093,565 bytes.
- `rg "SUPABASE_SERVICE_ROLE_KEY|SERVICE_ROLE" fitshelf-app -n` returned no matches.

Completion audit result:
- Not complete. Proxy URL encoding is fixed, but live Supabase patch application and physical phone proof remain required.
## 2026-05-11T14:52 - Storage Error Patch Hint Proof

Code proof:
- `fitshelf-app/src/lib/storage.ts` now appends `Run ai/supabase/stabilization_patch.sql in Supabase SQL editor...` for schema-cache, missing-column, and column-related DB errors.
- `tests/test_fitshelf_app_static.py` verifies `Run ${stabilizationPatchFile}` exists in both storage and Supabase debug helpers.

Prompt-to-artifact audit:
- Sanitized DB/RLS errors: storage-layer messages redact bearer tokens and now include actionable patch instructions for the current live failure mode.
- Visible UI path: App/Try-On catches these errors and displays them in sync/error status text.
- Live proof gap: phone still needs to rerun after applying the patch.

Verification:
- `npm run typecheck` passed.
- `py -m pytest tests/test_fitshelf_backend.py tests/test_fitshelf_tryon.py tests/test_fitshelf_app_static.py` passed with 26 tests.
- `py -m compileall ai/backend ai/fitshelf_tryon ai/scripts` passed.
- Temporary backend on port 8058 returned:
  - `/health`: `ok`.
  - `/supabase/schema-health`: `ok=false`, `patch_file=ai/supabase/stabilization_patch.sql`, with the known missing stabilization columns.
  - `/supabase/db-health`: `priority_tables_ok=false`, `patch_file=ai/supabase/stabilization_patch.sql`, with the known `person_images.image_url` schema-cache error.
- Temporary Expo bundle on port 8138 returned HTTP 200 with 22,093,949 bytes.
- `rg "SUPABASE_SERVICE_ROLE_KEY|SERVICE_ROLE" fitshelf-app -n` returned no matches.

Completion audit result:
- Not complete. App-side errors are clearer, but live Supabase patch application and physical phone proof remain required.
## 2026-05-11T14:56 - React Native Storage Upload Uses ArrayBuffer Proof

Code proof:
- `fitshelf-app/src/lib/storage.ts` imports `expo-file-system/legacy`.
- Local photo URIs are read with `FileSystem.readAsStringAsync(..., EncodingType.Base64)`.
- The base64 content is converted to an `ArrayBuffer` before `supabase.storage.from(...).upload(...)`.
- Remote URLs use `response.arrayBuffer()`.
- `tests/test_fitshelf_app_static.py` includes `test_supabase_asset_upload_uses_arraybuffer_for_react_native` and verifies `.blob()` is not used.

Prompt-to-artifact audit:
- Person/garment storage upload: now uses the React Native-compatible Supabase upload body type.
- Save messages: already guarded so Supabase success requires a real storage path.
- Live proof gap: phone still needs to prove `fitshelf-assets` uploads and `person_images`/`wardrobe_items` rows after applying the patch.

Verification:
- `npm run typecheck` passed.
- `py -m pytest tests/test_fitshelf_backend.py tests/test_fitshelf_tryon.py tests/test_fitshelf_app_static.py` passed with 27 tests.
- `py -m compileall ai/backend ai/fitshelf_tryon ai/scripts` passed.
- Temporary backend on port 8059 returned:
  - `/health`: `ok`.
  - `/supabase/schema-health`: `ok=false`, `patch_file=ai/supabase/stabilization_patch.sql`, with the known missing stabilization columns.
  - `/supabase/db-health`: `priority_tables_ok=false`, `patch_file=ai/supabase/stabilization_patch.sql`, with the known `person_images.image_url` schema-cache error.
- Temporary Expo bundle on port 8139 returned HTTP 200 with 22,096,270 bytes.
- `rg "SUPABASE_SERVICE_ROLE_KEY|SERVICE_ROLE" fitshelf-app -n` returned no matches.

Completion audit result:
- Not complete. Upload path is stronger, but live Supabase patch application and physical phone proof remain required.
## 2026-05-11T14:59 - Debug Asset Upload Uses ArrayBuffer Proof

Code proof:
- `fitshelf-app/src/lib/supabase.ts` now converts the debug text body to an ArrayBuffer with `textToArrayBuffer`.
- `Test Asset Upload` no longer uses `new Blob`.
- `tests/test_fitshelf_app_static.py` verifies `textToArrayBuffer` exists and no `new Blob` remains in `supabase.ts`.

Prompt-to-artifact audit:
- Visible storage debug action: still present as `Test Asset Upload`.
- React Native-compatible upload body: now used by both production image upload and debug asset upload.
- Live proof gap: phone still needs to prove the storage policy accepts `<user_id>/_debug/...` and person/garment asset paths.

Verification:
- `npm run typecheck` passed.
- `py -m pytest tests/test_fitshelf_backend.py tests/test_fitshelf_tryon.py tests/test_fitshelf_app_static.py` passed with 27 tests.
- `py -m compileall ai/backend ai/fitshelf_tryon ai/scripts` passed.
- Temporary backend on port 8060 returned:
  - `/health`: `ok`.
  - `/supabase/schema-health`: `ok=false`, `patch_file=ai/supabase/stabilization_patch.sql`, with the known missing stabilization columns.
  - `/supabase/db-health`: `priority_tables_ok=false`, `patch_file=ai/supabase/stabilization_patch.sql`, with the known `person_images.image_url` schema-cache error.
- Temporary Expo bundle on port 8140 returned HTTP 200 with 22,096,471 bytes.
- `rg "SUPABASE_SERVICE_ROLE_KEY|SERVICE_ROLE" fitshelf-app -n` returned no matches.

Completion audit result:
- Not complete. Debug upload path is stronger, but live Supabase patch application and physical phone proof remain required.
## 2026-05-11T15:03 - Upload Extension Allowlist Proof

Code proof:
- `fitshelf-app/src/lib/storage.ts` now only accepts `jpg`, `jpeg`, `png`, and `webp` as generated Storage path extensions.
- Extensionless picker URIs fall back to `jpg`.
- `tests/test_fitshelf_app_static.py` verifies the allowlist and fallback in the React Native ArrayBuffer upload contract.

Prompt-to-artifact audit:
- Person/garment upload path: React Native-compatible ArrayBuffer upload is present and now uses safe object path extensions.
- Save messages: Supabase success still requires a real storage path.
- Live proof gap: phone still needs to prove `fitshelf-assets` uploads and `person_images`/`wardrobe_items` rows after applying the patch.
- Next product phase: requested by operator but not started because stabilization is not yet complete.

Verification:
- `npm run typecheck` passed.
- `py -m pytest tests/test_fitshelf_backend.py tests/test_fitshelf_tryon.py tests/test_fitshelf_app_static.py` passed with 27 tests.
- `py -m compileall ai/backend ai/fitshelf_tryon ai/scripts` passed.
- Temporary backend on port 8061 returned:
  - `/health`: `ok`.
  - `/supabase/schema-health`: `ok=false`, `patch_file=ai/supabase/stabilization_patch.sql`, with the known missing stabilization columns.
  - `/supabase/db-health`: `priority_tables_ok=false`, `patch_file=ai/supabase/stabilization_patch.sql`, with the known `person_images.image_url` schema-cache error.
- Temporary Expo bundle on port 8141 returned HTTP 200 with 22,096,916 bytes.
- `rg "SUPABASE_SERVICE_ROLE_KEY|SERVICE_ROLE" fitshelf-app -n` returned no matches.

Completion audit result:
- Not complete. Upload path is stronger, but live Supabase patch application and physical phone proof remain required before the next product workflow phase.
## 2026-05-11T15:07 - Try-On Upload Metadata Guard Proof

Commands:
- `npm run typecheck` in `fitshelf-app/`
- `py -m pytest tests/test_fitshelf_backend.py tests/test_fitshelf_tryon.py tests/test_fitshelf_app_static.py`
- `py -m compileall ai/backend ai/fitshelf_tryon ai/scripts`
- Temporary backend health/schema/db probe on port 8062
- Temporary Expo bundle smoke on port 8142
- `rg "SUPABASE_SERVICE_ROLE_KEY|SERVICE_ROLE" fitshelf-app -n`

Results:
- TypeScript passed.
- Focused pytest suite passed with 28 tests.
- Python compileall passed.
- Backend `/health` returned ok.
- Backend `/supabase/schema-health` returned `ok=false`, `patch_file=ai/supabase/stabilization_patch.sql`, and missing `person_images.label`, `person_images.image_url`, `wardrobe_items.color`, `wardrobe_items.favorite`, `wardrobe_items.image_url`, `saved_looks.tryon_job_id`, `saved_looks.result_storage_path`, `saved_looks.local_result_url`.
- Backend `/supabase/db-health` returned `priority_tables_ok=false`, `patch_file=ai/supabase/stabilization_patch.sql`, and the known `person_images.image_url` schema-cache error.
- Expo bundle returned HTTP 200 with 22,097,630 bytes.
- Secret scan returned no app-side service-role matches.

Conclusion:
- Local stabilization code remains verified.
- Live stabilization is still blocked by the unapplied Supabase patch and physical phone proof.
## 2026-05-11T15:11 - Native GLB Asset Loader Path Proof

Changed evidence:
- `fitshelf-app/src/components/AvatarPanel.tsx` now defines `defaultAvatarModel = defaultAvatarAsset as unknown as string`.
- `GlbAvatar` now calls `useGLTF(defaultAvatarModel)`.
- The old URI-based loader call `useGLTF(modelUri)` is absent.
- `tests/test_fitshelf_app_static.py` now asserts the module-based GLB loader path.

Commands:
- `npm run typecheck` in `fitshelf-app/`
- `py -m pytest tests/test_fitshelf_backend.py tests/test_fitshelf_tryon.py tests/test_fitshelf_app_static.py`
- `py -m compileall ai/backend ai/fitshelf_tryon ai/scripts`
- Temporary backend health/schema/db probe on port 8063
- Temporary Expo bundle smoke on port 8143
- `rg "SUPABASE_SERVICE_ROLE_KEY|SERVICE_ROLE" fitshelf-app -n`

Results:
- TypeScript passed.
- Focused pytest suite passed with 28 tests.
- Python compileall passed.
- Backend `/health` returned ok.
- Backend `/supabase/schema-health` returned `ok=false`, `patch_file=ai/supabase/stabilization_patch.sql`, and the known missing stabilization columns.
- Backend `/supabase/db-health` returned `priority_tables_ok=false`, `patch_file=ai/supabase/stabilization_patch.sql`, and the known `person_images.image_url` schema-cache error.
- Expo bundle returned HTTP 200 with 22,097,621 bytes.
- Secret scan returned no app-side service-role matches.

Conclusion:
- The GLB loader path is locally strengthened and guarded.
- Phone proof is still required to confirm Expo Go displays the GLB instead of the fallback.
- Live persistence proof remains blocked by the unapplied Supabase patch.
## 2026-05-11T15:14 - Avatar Measurement Controls Layout Proof

Changed evidence:
- `fitshelf-app/src/components/AvatarPanel.tsx` now uses `flexWrap: "wrap"` for avatar measurements.
- Measurement field cards now use `flexBasis: "48%"`, `flexGrow: 1`, and `minWidth: 148`.
- Each measurement field still includes both `Slider` and numeric `TextInput`.
- `tests/test_fitshelf_app_static.py` guards the wrapping measurement layout.

Commands:
- `npm run typecheck` in `fitshelf-app/`
- `py -m pytest tests/test_fitshelf_backend.py tests/test_fitshelf_tryon.py tests/test_fitshelf_app_static.py`
- `py -m compileall ai/backend ai/fitshelf_tryon ai/scripts`
- Temporary backend health/schema/db probe on port 8064
- Temporary Expo bundle smoke on port 8144
- `rg "SUPABASE_SERVICE_ROLE_KEY|SERVICE_ROLE" fitshelf-app -n`

Results:
- TypeScript passed.
- Focused pytest suite passed with 28 tests.
- Python compileall passed.
- Backend `/health` returned ok.
- Backend `/supabase/schema-health` returned `ok=false`, `patch_file=ai/supabase/stabilization_patch.sql`, and the known missing stabilization columns.
- Backend `/supabase/db-health` returned `priority_tables_ok=false`, `patch_file=ai/supabase/stabilization_patch.sql`, and the known `person_images.image_url` schema-cache error.
- Expo bundle returned HTTP 200 with 22,097,736 bytes.
- Secret scan returned no app-side service-role matches.

Conclusion:
- Avatar controls are locally improved and guarded.
- Phone proof is still required for real layout, GLB render, and touch gestures.
## 2026-05-11T15:18 - Product Import Hidden During Stabilization Proof

Changed evidence:
- `fitshelf-app/App.tsx` no longer imports `fetchProductImages`.
- `fitshelf-app/App.tsx` no longer defines or wires `importProduct`.
- `fitshelf-app/src/components/LibraryPanel.tsx` no longer accepts `onImportProduct`.
- `fitshelf-app/src/components/LibraryPanel.tsx` no longer renders the `Product URL` input.
- Closet empty state now says `Add garments to build your wardrobe.`
- `tests/test_fitshelf_app_static.py` guards that product URL import is not exposed during stabilization.

Commands:
- `npm run typecheck` in `fitshelf-app/`
- `py -m pytest tests/test_fitshelf_backend.py tests/test_fitshelf_tryon.py tests/test_fitshelf_app_static.py`
- `py -m compileall ai/backend ai/fitshelf_tryon ai/scripts`
- Temporary backend health/schema/db probe on port 8065
- Temporary Expo bundle smoke on port 8145
- `rg "SUPABASE_SERVICE_ROLE_KEY|SERVICE_ROLE" fitshelf-app -n`

Results:
- TypeScript passed.
- Focused pytest suite passed with 29 tests.
- Python compileall passed.
- Backend `/health` returned ok.
- Backend `/supabase/schema-health` returned `ok=false`, `patch_file=ai/supabase/stabilization_patch.sql`, and the known missing stabilization columns.
- Backend `/supabase/db-health` returned `priority_tables_ok=false`, `patch_file=ai/supabase/stabilization_patch.sql`, and the known `person_images.image_url` schema-cache error.
- Expo bundle returned HTTP 200 with 22,091,886 bytes.
- Secret scan returned no app-side service-role matches.

Conclusion:
- The visible app surface is back inside stabilization scope.
- Live persistence proof remains blocked by the unapplied Supabase patch.
## 2026-05-11T15:22 - Avatar Fallback Diagnostic Proof

Changed evidence:
- `fitshelf-app/src/components/AvatarPanel.tsx` now includes `shortError(...)`.
- Asset download failures call `setModelError(shortError(error.message))`.
- GLB load boundary failures pass the error message into the parent and set the fallback diagnostic.
- Successful GLB load clears `modelError`.
- The fallback banner renders `viewerBannerDetail` when a diagnostic message exists.
- `tests/test_fitshelf_app_static.py` guards this diagnostic path.

Commands:
- `npm run typecheck` in `fitshelf-app/`
- `py -m pytest tests/test_fitshelf_backend.py tests/test_fitshelf_tryon.py tests/test_fitshelf_app_static.py`
- `py -m compileall ai/backend ai/fitshelf_tryon ai/scripts`
- Temporary backend health/schema/db probe on port 8066
- Temporary Expo bundle smoke on port 8146
- `rg "SUPABASE_SERVICE_ROLE_KEY|SERVICE_ROLE" fitshelf-app -n`

Results:
- TypeScript passed.
- Focused pytest suite passed with 29 tests.
- Python compileall passed.
- Backend `/health` returned ok.
- Backend `/supabase/schema-health` returned `ok=false`, `patch_file=ai/supabase/stabilization_patch.sql`, and the known missing stabilization columns.
- Backend `/supabase/db-health` returned `priority_tables_ok=false`, `patch_file=ai/supabase/stabilization_patch.sql`, and the known `person_images.image_url` schema-cache error.
- Expo bundle returned HTTP 200 with 22,092,877 bytes.
- Secret scan returned no app-side service-role matches.

Conclusion:
- Phone fallback should now provide actionable avatar failure detail.
- Live persistence proof remains blocked by the unapplied Supabase patch.
## 2026-05-11T15:25 - Avatar Finite Bounds Guard Proof

Changed evidence:
- `fitshelf-app/src/components/AvatarPanel.tsx` now includes `finiteVector(...)`.
- `fitshelf-app/src/components/AvatarPanel.tsx` now includes `largestFiniteDimension(...)`.
- `GlbAvatar` throws `GLB model has invalid finite bounds.` if model bounds or center are invalid.
- `GlbAvatar` throws `GLB model scale could not be computed.` if fit scale is invalid.
- `tests/test_fitshelf_app_static.py` guards these checks.

Commands:
- `npm run typecheck` in `fitshelf-app/`
- `py -m pytest tests/test_fitshelf_backend.py tests/test_fitshelf_tryon.py tests/test_fitshelf_app_static.py`
- `py -m compileall ai/backend ai/fitshelf_tryon ai/scripts`
- Temporary backend health/schema/db probe on port 8067
- Temporary Expo bundle smoke on port 8147
- `rg "SUPABASE_SERVICE_ROLE_KEY|SERVICE_ROLE" fitshelf-app -n`

Results:
- TypeScript passed.
- Focused pytest suite passed with 29 tests.
- Python compileall passed.
- Backend `/health` returned ok.
- Backend `/supabase/schema-health` returned `ok=false`, `patch_file=ai/supabase/stabilization_patch.sql`, and the known missing stabilization columns.
- Backend `/supabase/db-health` returned `priority_tables_ok=false`, `patch_file=ai/supabase/stabilization_patch.sql`, and the known `person_images.image_url` schema-cache error.
- Expo bundle returned HTTP 200 with 22,093,499 bytes.
- Secret scan returned no app-side service-role matches.

Conclusion:
- GLB autoscale should no longer collapse on invalid bounds; it should fall back with a visible diagnostic.
- Live persistence proof remains blocked by the unapplied Supabase patch.
## 2026-05-11T15:29 - Explicit Supabase Save Failure Wording Proof

Changed evidence:
- `fitshelf-app/App.tsx` now says `Person image was not saved to Supabase. Local copy kept.` when person row sync fails.
- `fitshelf-app/App.tsx` now says `Garment was not saved to Supabase. Local copy kept.` when garment row sync fails.
- The vague `local fallback active` wording is absent from `App.tsx`.
- `tests/test_fitshelf_app_static.py` guards these messages.

Commands:
- `npm run typecheck` in `fitshelf-app/`
- `py -m pytest tests/test_fitshelf_backend.py tests/test_fitshelf_tryon.py tests/test_fitshelf_app_static.py`
- `py -m compileall ai/backend ai/fitshelf_tryon ai/scripts`
- Temporary backend health/schema/db probe on port 8068
- Temporary Expo bundle smoke on port 8148
- `rg "SUPABASE_SERVICE_ROLE_KEY|SERVICE_ROLE" fitshelf-app -n`

Results:
- TypeScript passed.
- Focused pytest suite passed with 29 tests.
- Python compileall passed.
- Backend `/health` returned ok.
- Backend `/supabase/schema-health` returned `ok=false`, `patch_file=ai/supabase/stabilization_patch.sql`, and the known missing stabilization columns.
- Backend `/supabase/db-health` returned `priority_tables_ok=false`, `patch_file=ai/supabase/stabilization_patch.sql`, and the known `person_images.image_url` schema-cache error.
- Expo bundle returned HTTP 200 with 22,093,583 bytes.
- Secret scan returned no app-side service-role matches.

Conclusion:
- Phone testers should now see an explicit Supabase failure message if Save Person/Garment rows fail.
- Live persistence proof remains blocked by the unapplied Supabase patch.
## 2026-05-11T15:32 - Explicit Save Look Failure Wording Proof

Changed evidence:
- `fitshelf-app/src/components/TryOnPanel.tsx` now says `Look was not saved to Supabase. Local copy kept.` when Save Look Supabase sync fails.
- `tests/test_fitshelf_app_static.py` guards this message.

Commands:
- `npm run typecheck` in `fitshelf-app/`
- `py -m pytest tests/test_fitshelf_backend.py tests/test_fitshelf_tryon.py tests/test_fitshelf_app_static.py`
- `py -m compileall ai/backend ai/fitshelf_tryon ai/scripts`
- Temporary backend health/schema/db probe on port 8069
- Temporary Expo bundle smoke on port 8149
- `rg "SUPABASE_SERVICE_ROLE_KEY|SERVICE_ROLE" fitshelf-app -n`

Results:
- TypeScript passed.
- Focused pytest suite passed with 29 tests.
- Python compileall passed.
- Backend `/health` returned ok.
- Backend `/supabase/schema-health` returned `ok=false`, `patch_file=ai/supabase/stabilization_patch.sql`, and the known missing stabilization columns.
- Backend `/supabase/db-health` returned `priority_tables_ok=false`, `patch_file=ai/supabase/stabilization_patch.sql`, and the known `person_images.image_url` schema-cache error.
- Expo bundle returned HTTP 200 with 22,093,607 bytes.
- Secret scan returned no app-side service-role matches.

Conclusion:
- Phone testers should now see an explicit Supabase failure message if Save Look rows fail.
- Live persistence proof remains blocked by the unapplied Supabase patch.
## 2026-05-11T15:35 - Storage Path Public URL Reload Fallback Proof

Changed evidence:
- `fitshelf-app/src/lib/storage.ts` now includes `publicAssetUrl(storagePath)`.
- `loadMannequins()` now maps image URI as `row.image_url ?? publicAssetUrl(row.storage_path) ?? row.storage_path`.
- `loadClothing()` now maps image URI as `row.image_url ?? publicAssetUrl(row.storage_path) ?? row.storage_path`.
- `tests/test_fitshelf_app_static.py` guards this fallback.

Commands:
- `npm run typecheck` in `fitshelf-app/`
- `py -m pytest tests/test_fitshelf_backend.py tests/test_fitshelf_tryon.py tests/test_fitshelf_app_static.py`
- `py -m compileall ai/backend ai/fitshelf_tryon ai/scripts`
- Temporary backend health/schema/db probe on port 8070
- Temporary Expo bundle smoke on port 8150
- `rg "SUPABASE_SERVICE_ROLE_KEY|SERVICE_ROLE" fitshelf-app -n`

Results:
- TypeScript passed.
- Focused pytest suite passed with 30 tests.
- Python compileall passed.
- Backend `/health` returned ok.
- Backend `/supabase/schema-health` returned `ok=false`, `patch_file=ai/supabase/stabilization_patch.sql`, and the known missing stabilization columns.
- Backend `/supabase/db-health` returned `priority_tables_ok=false`, `patch_file=ai/supabase/stabilization_patch.sql`, and the known `person_images.image_url` schema-cache error.
- Expo bundle returned HTTP 200 with 22,094,028 bytes.
- Secret scan returned no app-side service-role matches.

Conclusion:
- Existing rows with `storage_path` but missing `image_url` should reload with displayable public asset URLs.
- Live persistence proof remains blocked by the unapplied Supabase patch.
## 2026-05-11T15:40 - Saved Look Thumbnail Proxy Fallback Proof

Changed evidence:
- `fitshelf-app/src/components/TryOnPanel.tsx` now includes `savedLookThumbnailUrl(look)`.
- Saved Look thumbnails now render `savedLookThumbnailUrl(look)` instead of `look.localResultUrl ?? look.resultUrl`.
- When `look.resultStoragePath` exists and there is no `localResultUrl`, the thumbnail URL is the backend `/supabase/object?storage_path=...` proxy.
- `tests/test_fitshelf_app_static.py` guards this fallback.

Commands:
- `npm run typecheck` in `fitshelf-app/`
- `py -m pytest tests/test_fitshelf_backend.py tests/test_fitshelf_tryon.py tests/test_fitshelf_app_static.py`
- `py -m compileall ai/backend ai/fitshelf_tryon ai/scripts`
- Temporary backend health/schema/db probe on port 8071
- Temporary Expo bundle smoke on port 8151
- `rg "SUPABASE_SERVICE_ROLE_KEY|SERVICE_ROLE" fitshelf-app -n`

Results:
- TypeScript passed.
- Focused pytest suite passed with 30 tests.
- Python compileall passed.
- Backend `/health` returned ok.
- Backend `/supabase/schema-health` returned `ok=false`, `patch_file=ai/supabase/stabilization_patch.sql`, and the known missing stabilization columns.
- Backend `/supabase/db-health` returned `priority_tables_ok=false`, `patch_file=ai/supabase/stabilization_patch.sql`, and the known `person_images.image_url` schema-cache error.
- Expo bundle returned HTTP 200 with 22,094,248 bytes.
- Secret scan returned no app-side service-role matches.

Conclusion:
- Saved Look thumbnails should avoid expired signed URLs when durable storage paths are available.
- Live persistence proof remains blocked by the unapplied Supabase patch.
## 2026-05-11T15:44 - Explicit Rename Failure Wording Proof

Changed evidence:
- `fitshelf-app/src/components/TryOnPanel.tsx` now says `Rename was not saved to Supabase. Local name kept.` when saved-look rename sync fails.
- `tests/test_fitshelf_app_static.py` guards this message.

Commands:
- `npm run typecheck` in `fitshelf-app/`
- `py -m pytest tests/test_fitshelf_backend.py tests/test_fitshelf_tryon.py tests/test_fitshelf_app_static.py`
- `py -m compileall ai/backend ai/fitshelf_tryon ai/scripts`
- Temporary backend health/schema/db probe on port 8072
- Temporary Expo bundle smoke on port 8152
- `rg "SUPABASE_SERVICE_ROLE_KEY|SERVICE_ROLE" fitshelf-app -n`

Results:
- TypeScript passed.
- Focused pytest suite passed with 30 tests.
- Python compileall passed.
- Backend `/health` returned ok.
- Backend `/supabase/schema-health` returned `ok=false`, `patch_file=ai/supabase/stabilization_patch.sql`, and the known missing stabilization columns.
- Backend `/supabase/db-health` returned `priority_tables_ok=false`, `patch_file=ai/supabase/stabilization_patch.sql`, and the known `person_images.image_url` schema-cache error.
- Expo bundle returned HTTP 200 with 22,094,262 bytes.
- Secret scan returned no app-side service-role matches.

Conclusion:
- Rename failure copy now clearly distinguishes local-only fallback from a Supabase-persisted rename.
- Live persistence proof remains blocked by the unapplied Supabase patch.
## 2026-05-11T15:48 - Closet Edit/Delete Failure Wording Proof

Changed evidence:
- `fitshelf-app/App.tsx` now says `Person image update was not saved to Supabase. Local edit kept.` when person edit sync fails.
- `fitshelf-app/App.tsx` now says `Person image delete was not saved to Supabase. Local list updated.` when person delete sync fails.
- `fitshelf-app/App.tsx` now says `Wardrobe item update was not saved to Supabase. Local edit kept.` when wardrobe edit sync fails.
- `fitshelf-app/App.tsx` now says `Wardrobe item delete was not saved to Supabase. Local list updated.` when wardrobe delete sync fails.
- `tests/test_fitshelf_app_static.py` guards these messages.

Commands:
- `npm run typecheck` in `fitshelf-app/`
- `py -m pytest tests/test_fitshelf_backend.py tests/test_fitshelf_tryon.py tests/test_fitshelf_app_static.py`
- `py -m compileall ai/backend ai/fitshelf_tryon ai/scripts`
- Temporary backend health/schema/db probe on port 8073
- Temporary Expo bundle smoke on port 8153
- `rg "SUPABASE_SERVICE_ROLE_KEY|SERVICE_ROLE" fitshelf-app -n`

Results:
- TypeScript passed.
- Focused pytest suite passed with 30 tests.
- Python compileall passed.
- Backend `/health` returned ok.
- Backend `/supabase/schema-health` returned `ok=false`, `patch_file=ai/supabase/stabilization_patch.sql`, and the known missing stabilization columns.
- Backend `/supabase/db-health` returned `priority_tables_ok=false`, `patch_file=ai/supabase/stabilization_patch.sql`, and the known `person_images.image_url` schema-cache error.
- Expo bundle returned HTTP 200 with 22,094,546 bytes.
- Secret scan returned no app-side service-role matches.

Conclusion:
- Closet edit/delete failures now clearly distinguish local state changes from Supabase-persisted changes.
- Live persistence proof remains blocked by the unapplied Supabase patch.
## 2026-05-11T15:51 - Saved Look Delete Failure Wording Proof

Changed evidence:
- `fitshelf-app/src/components/TryOnPanel.tsx` now says `Delete was not saved to Supabase. Local list kept.` when saved-look delete sync fails.
- `tests/test_fitshelf_app_static.py` guards this message.

Commands:
- `npm run typecheck` in `fitshelf-app/`
- `py -m pytest tests/test_fitshelf_backend.py tests/test_fitshelf_tryon.py tests/test_fitshelf_app_static.py`
- `py -m compileall ai/backend ai/fitshelf_tryon ai/scripts`
- Temporary backend health/schema/db probe on port 8074
- Temporary Expo bundle smoke on port 8154
- `rg "SUPABASE_SERVICE_ROLE_KEY|SERVICE_ROLE" fitshelf-app -n`

Results:
- TypeScript passed.
- Focused pytest suite passed with 30 tests.
- Python compileall passed.
- Backend `/health` returned ok.
- Backend `/supabase/schema-health` returned `ok=false`, `patch_file=ai/supabase/stabilization_patch.sql`, and the known missing stabilization columns.
- Backend `/supabase/db-health` returned `priority_tables_ok=false`, `patch_file=ai/supabase/stabilization_patch.sql`, and the known `person_images.image_url` schema-cache error.
- Expo bundle returned HTTP 200 with 22,094,618 bytes.
- Secret scan returned no app-side service-role matches.

Conclusion:
- Saved Look delete failures now clearly distinguish local list state from Supabase-persisted deletion.
- Live persistence proof remains blocked by the unapplied Supabase patch.
## 2026-05-11T15:55 - Saved Look Delete Local Storage Ordering Proof

Changed evidence:
- `fitshelf-app/src/lib/storage.ts` now performs the Supabase `saved_looks` delete before writing the local Saved Looks list.
- If the Supabase delete fails, `writeJson(keys.savedLooks, next)` is not reached, so local storage matches the UI message that the local list was kept.
- `tests/test_fitshelf_app_static.py` now guards this ordering.

Commands:
- `npm run typecheck` in `fitshelf-app/`
- `py -m pytest tests/test_fitshelf_backend.py tests/test_fitshelf_tryon.py tests/test_fitshelf_app_static.py`
- `py -m compileall ai/backend ai/fitshelf_tryon ai/scripts`
- Temporary backend health/schema/db probe on port 8075
- Temporary Expo bundle smoke on port 8155
- `rg "SUPABASE_SERVICE_ROLE_KEY|SERVICE_ROLE" fitshelf-app -n`

Results:
- TypeScript passed.
- Focused pytest suite passed with 31 tests.
- Python compileall passed.
- Backend `/health` returned ok.
- Backend `/supabase/schema-health` returned `ok=false`, `patch_file=ai/supabase/stabilization_patch.sql`, and the known missing stabilization columns.
- Backend `/supabase/db-health` returned `priority_tables_ok=false`, `patch_file=ai/supabase/stabilization_patch.sql`, and the known `person_images.image_url` schema-cache error.
- Expo bundle returned HTTP 200 with 22,094,618 bytes.
- Secret scan returned no app-side service-role matches.

Conclusion:
- Saved Look delete failure state is now internally consistent across UI memory and local persisted storage.
- Live persistence proof remains blocked by the unapplied Supabase patch.
## 2026-05-11T15:59 - Manual Auth Session Recovery Button Proof

Changed evidence:
- `fitshelf-app/src/components/AuthPanel.tsx` now includes a `Check session` action.
- The action calls `supabase.auth.getSession()`, ensures the Supabase profile, and enters the app if a session is present.
- If no app session exists, it tells the user to paste the full verification callback URL when email did not reopen FitShelf.
- `tests/test_fitshelf_app_static.py` guards this auth recovery contract.

Commands:
- `npm run typecheck` in `fitshelf-app/`
- `py -m pytest tests/test_fitshelf_backend.py tests/test_fitshelf_tryon.py tests/test_fitshelf_app_static.py`
- `py -m compileall ai/backend ai/fitshelf_tryon ai/scripts`
- Temporary backend health/schema/db probe on port 8076
- Temporary Expo bundle smoke on port 8156
- `rg "SUPABASE_SERVICE_ROLE_KEY|SERVICE_ROLE" fitshelf-app -n`

Results:
- TypeScript passed.
- Focused pytest suite passed with 31 tests.
- Python compileall passed.
- Backend `/health` returned ok.
- Backend `/supabase/schema-health` returned `ok=false`, `patch_file=ai/supabase/stabilization_patch.sql`, and the known missing stabilization columns.
- Backend `/supabase/db-health` returned `priority_tables_ok=false`, `patch_file=ai/supabase/stabilization_patch.sql`, and the known `person_images.image_url` schema-cache error.
- Expo bundle returned HTTP 200 with 22,097,080 bytes.
- Secret scan returned no app-side service-role matches.

Conclusion:
- Auth recovery is more testable when email verification does not automatically reopen FitShelf.
- Live persistence proof remains blocked by the unapplied Supabase patch.
## 2026-05-11T16:02 - Auth Recovery Busy State And Docs Proof

Changed evidence:
- `fitshelf-app/src/components/AuthPanel.tsx` keeps `Check session` busy state active through profile creation instead of ending immediately after `getSession()`.
- `fitshelf-app/README.md` documents using `Check session` after manually returning from email verification.
- The physical phone checklist in `fitshelf-app/README.md` now includes automatic redirect, `Check session`, or `Restore callback` auth recovery before persistence checks.
- `tests/test_fitshelf_app_static.py` guards the updated auth recovery contract and README text.

Commands:
- `npm run typecheck` in `fitshelf-app/`
- `py -m pytest tests/test_fitshelf_backend.py tests/test_fitshelf_tryon.py tests/test_fitshelf_app_static.py`
- `py -m compileall ai/backend ai/fitshelf_tryon ai/scripts`
- Temporary backend health/schema/db probe on port 8077
- Temporary Expo bundle smoke on port 8157
- `rg "SUPABASE_SERVICE_ROLE_KEY|SERVICE_ROLE" fitshelf-app -n`

Results:
- TypeScript passed.
- Focused pytest suite passed with 31 tests.
- Python compileall passed.
- Backend `/health` returned ok.
- Backend `/supabase/schema-health` returned `ok=false`, `patch_file=ai/supabase/stabilization_patch.sql`, and the known missing stabilization columns.
- Backend `/supabase/db-health` returned `priority_tables_ok=false`, `patch_file=ai/supabase/stabilization_patch.sql`, and the known `person_images.image_url` schema-cache error.
- Expo bundle returned HTTP 200 with 22,097,132 bytes.
- Secret scan returned no app-side service-role matches.

Conclusion:
- Auth recovery behavior and manual test documentation are now aligned.
- Live persistence proof remains blocked by the unapplied Supabase patch.
## 2026-05-11T16:06 - Avatar Saved Status Keeps Model State Visible Proof

Changed evidence:
- `fitshelf-app/src/components/AvatarPanel.tsx` now uses `avatarStatusLabel(modelStatus, saved)`.
- After saving, the avatar header shows `Saved | GLB`, `Saved | Fallback`, or `Saved | Loading` instead of hiding the model state behind only `Saved`.
- `tests/test_fitshelf_app_static.py` guards this status-label contract.

Commands:
- `npm run typecheck` in `fitshelf-app/`
- `py -m pytest tests/test_fitshelf_backend.py tests/test_fitshelf_tryon.py tests/test_fitshelf_app_static.py`
- `py -m compileall ai/backend ai/fitshelf_tryon ai/scripts`
- Temporary backend health/schema/db probe on port 8078
- Temporary Expo bundle smoke on port 8158
- `rg "SUPABASE_SERVICE_ROLE_KEY|SERVICE_ROLE" fitshelf-app -n`

Results:
- TypeScript passed.
- Focused pytest suite passed with 31 tests.
- Python compileall passed.
- Backend `/health` returned ok.
- Backend `/supabase/schema-health` returned `ok=false`, `patch_file=ai/supabase/stabilization_patch.sql`, and the known missing stabilization columns.
- Backend `/supabase/db-health` returned `priority_tables_ok=false`, `patch_file=ai/supabase/stabilization_patch.sql`, and the known `person_images.image_url` schema-cache error.
- Expo bundle returned HTTP 200 with 22,097,286 bytes.
- Secret scan returned no app-side service-role matches.

Conclusion:
- Phone testers can still see whether the real GLB is loaded after saving the avatar profile.
- Live persistence proof remains blocked by the unapplied Supabase patch.
## 2026-05-11T16:09 - Restore Callback Busy State Proof

Changed evidence:
- `fitshelf-app/src/components/AuthPanel.tsx` keeps `Restore callback` busy state active through profile creation instead of ending immediately after `handleSupabaseAuthCallback()`.
- `tests/test_fitshelf_app_static.py` guards the failure path that clears busy before returning when callback handling fails.

Commands:
- `npm run typecheck` in `fitshelf-app/`
- `py -m pytest tests/test_fitshelf_backend.py tests/test_fitshelf_tryon.py tests/test_fitshelf_app_static.py`
- `py -m compileall ai/backend ai/fitshelf_tryon ai/scripts`
- Temporary backend health/schema/db probe on port 8079
- Temporary Expo bundle smoke on port 8159
- `rg "SUPABASE_SERVICE_ROLE_KEY|SERVICE_ROLE" fitshelf-app -n`

Results:
- TypeScript passed.
- Focused pytest suite passed with 31 tests.
- Python compileall passed.
- Backend `/health` returned ok.
- Backend `/supabase/schema-health` returned `ok=false`, `patch_file=ai/supabase/stabilization_patch.sql`, and the known missing stabilization columns.
- Backend `/supabase/db-health` returned `priority_tables_ok=false`, `patch_file=ai/supabase/stabilization_patch.sql`, and the known `person_images.image_url` schema-cache error.
- Expo bundle returned HTTP 200 with 22,097,334 bytes.
- Secret scan returned no app-side service-role matches.

Conclusion:
- Both visible auth recovery paths now keep busy state active through profile readiness checks.
- Live persistence proof remains blocked by the unapplied Supabase patch.
## 2026-05-11T16:13 - Sign-In Profile Readiness Gate Proof

Changed evidence:
- `fitshelf-app/src/components/AuthPanel.tsx` now keeps sign-in/sign-up busy state active through `ensureSupabaseProfile()`.
- The normal auth path no longer enters the app if profile creation fails.
- On success, the app session uses `profile.userId` and `profile.email ?? user.email`.
- `tests/test_fitshelf_app_static.py` guards the profile failure message and profile-backed session payload.

Commands:
- `npm run typecheck` in `fitshelf-app/`
- `py -m pytest tests/test_fitshelf_backend.py tests/test_fitshelf_tryon.py tests/test_fitshelf_app_static.py`
- `py -m compileall ai/backend ai/fitshelf_tryon ai/scripts`
- Temporary backend health/schema/db probe on port 8080
- Temporary Expo bundle smoke on port 8160
- `rg "SUPABASE_SERVICE_ROLE_KEY|SERVICE_ROLE" fitshelf-app -n`

Results:
- TypeScript passed.
- Focused pytest suite passed with 31 tests.
- Python compileall passed.
- Backend `/health` returned ok.
- Backend `/supabase/schema-health` returned `ok=false`, `patch_file=ai/supabase/stabilization_patch.sql`, and the known missing stabilization columns.
- Backend `/supabase/db-health` returned `priority_tables_ok=false`, `patch_file=ai/supabase/stabilization_patch.sql`, and the known `person_images.image_url` schema-cache error.
- Expo bundle returned HTTP 200 with 22,097,707 bytes.
- Secret scan returned no app-side service-role matches.

Conclusion:
- The normal auth path now waits for profile readiness like the manual recovery paths.
- Live persistence proof remains blocked by the unapplied Supabase patch.
## 2026-05-11T16:15 - Auth State Listener Profile Gate Proof

Changed evidence:
- `fitshelf-app/App.tsx` no longer sets a Supabase app session in `onAuthStateChange` before `ensureSupabaseProfile()` completes.
- If the auth-state listener cannot create/read the profile, it clears the session and shows `Auth changed, but profile creation failed.`
- On success, the listener uses `profile.userId` and `profile.email ?? nextSession.user.email`.
- `tests/test_fitshelf_app_static.py` guards this auth-state listener contract.

Commands:
- `npm run typecheck` in `fitshelf-app/`
- `py -m pytest tests/test_fitshelf_backend.py tests/test_fitshelf_tryon.py tests/test_fitshelf_app_static.py`
- `py -m compileall ai/backend ai/fitshelf_tryon ai/scripts`
- Temporary backend health/schema/db probe on port 8081
- Temporary Expo bundle smoke on port 8161
- `rg "SUPABASE_SERVICE_ROLE_KEY|SERVICE_ROLE" fitshelf-app -n`

Results:
- TypeScript passed.
- Focused pytest suite passed with 31 tests.
- Python compileall passed.
- Backend `/health` returned ok.
- Backend `/supabase/schema-health` returned `ok=false`, `patch_file=ai/supabase/stabilization_patch.sql`, and the known missing stabilization columns.
- Backend `/supabase/db-health` returned `priority_tables_ok=false`, `patch_file=ai/supabase/stabilization_patch.sql`, and the known `person_images.image_url` schema-cache error.
- Expo bundle returned HTTP 200 with 22,098,121 bytes.
- Secret scan returned no app-side service-role matches.

Conclusion:
- All app auth entry paths now gate workspace entry on profile readiness.
- Live persistence proof remains blocked by the unapplied Supabase patch.
## 2026-05-11T16:18 - Startup And Incoming Callback Profile Gates Proof

Changed evidence:
- `fitshelf-app/App.tsx` now gates `restoreSession()` on `ensureSupabaseProfile()` before setting the app session.
- `fitshelf-app/App.tsx` now gates `handleIncomingUrl()` on `ensureSupabaseProfile()` before setting the app session.
- Startup restore failure shows `Session restored, but profile creation failed.`
- Incoming callback profile failure shows `Auth callback restored session, but profile creation failed.`
- `tests/test_fitshelf_app_static.py` guards these profile-backed session paths.

Commands:
- `npm run typecheck` in `fitshelf-app/`
- `py -m pytest tests/test_fitshelf_backend.py tests/test_fitshelf_tryon.py tests/test_fitshelf_app_static.py`
- `py -m compileall ai/backend ai/fitshelf_tryon ai/scripts`
- Temporary backend health/schema/db probe on port 8082
- Temporary Expo bundle smoke on port 8162
- `rg "SUPABASE_SERVICE_ROLE_KEY|SERVICE_ROLE" fitshelf-app -n`

Results:
- TypeScript passed.
- Focused pytest suite passed with 31 tests.
- Python compileall passed.
- Backend `/health` returned ok.
- Backend `/supabase/schema-health` returned `ok=false`, `patch_file=ai/supabase/stabilization_patch.sql`, and the known missing stabilization columns.
- Backend `/supabase/db-health` returned `priority_tables_ok=false`, `patch_file=ai/supabase/stabilization_patch.sql`, and the known `person_images.image_url` schema-cache error.
- Expo bundle returned HTTP 200 with 22,098,563 bytes.
- Secret scan returned no app-side service-role matches.

Conclusion:
- Startup session restore and incoming auth callback handling now use profile-backed app sessions.
- Live persistence proof remains blocked by the unapplied Supabase patch.
## 2026-05-11T16:21 - Explicit Avatar Profile Failure Wording Proof

Changed evidence:
- `fitshelf-app/src/components/AvatarPanel.tsx` now says `Avatar profile was not saved to Supabase. Local profile kept.` when avatar profile sync fails.
- `tests/test_fitshelf_app_static.py` guards this message.

Commands:
- `npm run typecheck` in `fitshelf-app/`
- `py -m pytest tests/test_fitshelf_backend.py tests/test_fitshelf_tryon.py tests/test_fitshelf_app_static.py`
- `py -m compileall ai/backend ai/fitshelf_tryon ai/scripts`
- Temporary backend health/schema/db probe on port 8083
- Temporary Expo bundle smoke on port 8163
- `rg "SUPABASE_SERVICE_ROLE_KEY|SERVICE_ROLE" fitshelf-app -n`

Results:
- TypeScript passed.
- Focused pytest suite passed with 31 tests.
- Python compileall passed.
- Backend `/health` returned ok.
- Backend `/supabase/schema-health` returned `ok=false`, `patch_file=ai/supabase/stabilization_patch.sql`, and the known missing stabilization columns.
- Backend `/supabase/db-health` returned `priority_tables_ok=false`, `patch_file=ai/supabase/stabilization_patch.sql`, and the known `person_images.image_url` schema-cache error.
- Expo bundle returned HTTP 200 with 22,098,631 bytes.
- Secret scan returned no app-side service-role matches.

Conclusion:
- Avatar profile failures now clearly distinguish local-only persistence from a Supabase save.
- Live persistence proof remains blocked by the unapplied Supabase patch.
## 2026-05-11T16:24 - Save Look Local Failure Persistence Proof

Changed evidence:
- `fitshelf-app/src/lib/storage.ts` now exports `saveSavedLooksLocally()`.
- `fitshelf-app/src/components/TryOnPanel.tsx` calls `saveSavedLooksLocally(next)` in the Save Look failure path.
- If `saveTryOnJobRecord()` fails before `saveSavedLooks()` runs, the message `Look was not saved to Supabase. Local copy kept.` now has a local storage write behind it.
- `tests/test_fitshelf_app_static.py` guards this fallback call.

Commands:
- `npm run typecheck` in `fitshelf-app/`
- `py -m pytest tests/test_fitshelf_backend.py tests/test_fitshelf_tryon.py tests/test_fitshelf_app_static.py`
- `py -m compileall ai/backend ai/fitshelf_tryon ai/scripts`
- Temporary backend health/schema/db probe on port 8084
- Temporary Expo bundle smoke on port 8164
- `rg "SUPABASE_SERVICE_ROLE_KEY|SERVICE_ROLE" fitshelf-app -n`

Results:
- TypeScript passed.
- Focused pytest suite passed with 31 tests.
- Python compileall passed.
- Backend `/health` returned ok.
- Backend `/supabase/schema-health` returned `ok=false`, `patch_file=ai/supabase/stabilization_patch.sql`, and the known missing stabilization columns.
- Backend `/supabase/db-health` returned `priority_tables_ok=false`, `patch_file=ai/supabase/stabilization_patch.sql`, and the known `person_images.image_url` schema-cache error.
- Expo bundle returned HTTP 200 with 22,099,088 bytes.
- Secret scan returned no app-side service-role matches.

Conclusion:
- Save Look local fallback now persists locally even if try-on job Supabase sync fails first.
- Live persistence proof remains blocked by the unapplied Supabase patch.
## 2026-05-11T16:26 - Saved Look Thumbnail Failure Visibility Proof

Changed evidence:
- `fitshelf-app/src/components/TryOnPanel.tsx` now attaches `onError` to Saved Look thumbnail images.
- Thumbnail failures now show `Saved Look thumbnail failed for ${look.name}. Open the look to refresh the result image.`
- `tests/test_fitshelf_app_static.py` guards this message.

Commands:
- `npm run typecheck` in `fitshelf-app/`
- `py -m pytest tests/test_fitshelf_backend.py tests/test_fitshelf_tryon.py tests/test_fitshelf_app_static.py`
- `py -m compileall ai/backend ai/fitshelf_tryon ai/scripts`
- Temporary backend health/schema/db probe on port 8085
- Temporary Expo bundle smoke on port 8165
- `rg "SUPABASE_SERVICE_ROLE_KEY|SERVICE_ROLE" fitshelf-app -n`

Results:
- TypeScript passed.
- Focused pytest suite passed with 31 tests.
- Python compileall passed.
- Backend `/health` returned ok.
- Backend `/supabase/schema-health` returned `ok=false`, `patch_file=ai/supabase/stabilization_patch.sql`, and the known missing stabilization columns.
- Backend `/supabase/db-health` returned `priority_tables_ok=false`, `patch_file=ai/supabase/stabilization_patch.sql`, and the known `person_images.image_url` schema-cache error.
- Expo bundle returned HTTP 200 with 22,099,274 bytes.
- Secret scan returned no app-side service-role matches.

Conclusion:
- Saved Looks gallery thumbnail failures are now visible instead of silently blank.
- Live persistence proof remains blocked by the unapplied Supabase patch.
## 2026-05-11T16:29 - Saved Look Open Proxy Fallback Proof

Changed evidence:
- `fitshelf-app/src/components/TryOnPanel.tsx` now falls back to the backend `/supabase/object` proxy when opening a Saved Look and signed URL refresh fails but `resultStoragePath` exists.
- This happens before falling back to `localResultUrl`.
- `tests/test_fitshelf_app_static.py` guards the proxy assignment and saved-look fallback message.

Commands:
- `npm run typecheck` in `fitshelf-app/`
- `py -m pytest tests/test_fitshelf_backend.py tests/test_fitshelf_tryon.py tests/test_fitshelf_app_static.py`
- `py -m compileall ai/backend ai/fitshelf_tryon ai/scripts`
- Temporary backend health/schema/db probe on port 8086
- Temporary Expo bundle smoke on port 8166
- `rg "SUPABASE_SERVICE_ROLE_KEY|SERVICE_ROLE" fitshelf-app -n`

Results:
- TypeScript passed.
- Focused pytest suite passed with 31 tests.
- Python compileall passed.
- Backend `/health` returned ok.
- Backend `/supabase/schema-health` returned `ok=false`, `patch_file=ai/supabase/stabilization_patch.sql`, and the known missing stabilization columns.
- Backend `/supabase/db-health` returned `priority_tables_ok=false`, `patch_file=ai/supabase/stabilization_patch.sql`, and the known `person_images.image_url` schema-cache error.
- Expo bundle returned HTTP 200 with 22,099,663 bytes.
- Secret scan returned no app-side service-role matches.

Conclusion:
- Opening a Saved Look with durable storage now has a backend proxy fallback if signed URL refresh fails.
- Live persistence proof remains blocked by the unapplied Supabase patch.
## 2026-05-11T16:32 - Saved Look Refresh Fallback Copy Proof

Changed evidence:
- `fitshelf-app/src/components/TryOnPanel.tsx` now reports `Saved look opened with backend proxy fallback.` when durable storage proxy fallback is used.
- It reports `Saved look opened with local fallback.` only when `localResultUrl` is used.
- It reports `Saved look refresh failed.` when neither proxy nor local fallback is available.
- `tests/test_fitshelf_app_static.py` guards these messages.

Commands:
- `npm run typecheck` in `fitshelf-app/`
- `py -m pytest tests/test_fitshelf_backend.py tests/test_fitshelf_tryon.py tests/test_fitshelf_app_static.py`
- `py -m compileall ai/backend ai/fitshelf_tryon ai/scripts`
- Temporary backend health/schema/db probe on port 8087
- Temporary Expo bundle smoke on port 8167
- `rg "SUPABASE_SERVICE_ROLE_KEY|SERVICE_ROLE" fitshelf-app -n`

Results:
- TypeScript passed.
- Focused pytest suite passed with 31 tests.
- Python compileall passed.
- Backend `/health` returned ok.
- Backend `/supabase/schema-health` returned `ok=false`, `patch_file=ai/supabase/stabilization_patch.sql`, and the known missing stabilization columns.
- Backend `/supabase/db-health` returned `priority_tables_ok=false`, `patch_file=ai/supabase/stabilization_patch.sql`, and the known `person_images.image_url` schema-cache error.
- Expo bundle returned HTTP 200 with 22,099,824 bytes.
- Secret scan returned no app-side service-role matches.

Conclusion:
- Saved Look refresh failure copy now identifies the actual fallback source.
- Live persistence proof remains blocked by the unapplied Supabase patch.
## 2026-05-11T16:35 - Local Fallback Reload Merge Proof

Changed evidence:
- `fitshelf-app/src/lib/storage.ts` now includes `mergeLocalFallbacks()`.
- `loadMannequins()` merges local fallback person images after Supabase rows.
- `loadClothing()` merges local fallback wardrobe items after Supabase rows.
- `loadSavedLooks()` merges local fallback Saved Looks after Supabase rows.
- `tests/test_fitshelf_app_static.py` guards the merge helper and its three reload call sites.

Commands:
- `npm run typecheck` in `fitshelf-app/`
- `py -m pytest tests/test_fitshelf_backend.py tests/test_fitshelf_tryon.py tests/test_fitshelf_app_static.py`
- `py -m compileall ai/backend ai/fitshelf_tryon ai/scripts`
- Temporary backend health/schema/db probe on port 8088
- Temporary Expo bundle smoke on port 8168
- `rg "SUPABASE_SERVICE_ROLE_KEY|SERVICE_ROLE" fitshelf-app -n`

Results:
- TypeScript passed.
- Focused pytest suite passed with 31 tests.
- Python compileall passed.
- Backend `/health` returned ok.
- Backend `/supabase/schema-health` returned `ok=false`, `patch_file=ai/supabase/stabilization_patch.sql`, and the known missing stabilization columns.
- Backend `/supabase/db-health` returned `priority_tables_ok=false`, `patch_file=ai/supabase/stabilization_patch.sql`, and the known `person_images.image_url` schema-cache error.
- Expo bundle returned HTTP 200 with 22,100,505 bytes.
- Secret scan returned no app-side service-role matches.

Conclusion:
- Local fallback people, wardrobe items, and Saved Looks should remain visible after restart/navigation even when Supabase returns rows but the fallback row was not synced.
- Live persistence proof remains blocked by the unapplied Supabase patch.
## 2026-05-11T16:38 - Save Look Double-Failure Visibility Proof

Changed evidence:
- `fitshelf-app/src/components/TryOnPanel.tsx` now catches failures from `saveSavedLooksLocally(next)` inside the Save Look Supabase failure path.
- If both Supabase persistence and local fallback persistence fail, the UI shows `Look was not saved to Supabase or local storage.`
- `tests/test_fitshelf_app_static.py` guards this message.

Commands:
- `npm run typecheck` in `fitshelf-app/`
- `py -m pytest tests/test_fitshelf_backend.py tests/test_fitshelf_tryon.py tests/test_fitshelf_app_static.py`
- `py -m compileall ai/backend ai/fitshelf_tryon ai/scripts`
- Temporary backend health/schema/db probe on port 8089
- Temporary Expo bundle smoke on port 8169
- `rg "SUPABASE_SERVICE_ROLE_KEY|SERVICE_ROLE" fitshelf-app -n`

Results:
- TypeScript passed.
- Focused pytest suite passed with 31 tests.
- Python compileall passed.
- Backend `/health` returned ok.
- Backend `/supabase/schema-health` returned `ok=false`, `patch_file=ai/supabase/stabilization_patch.sql`, and the known missing stabilization columns.
- Backend `/supabase/db-health` returned `priority_tables_ok=false`, `patch_file=ai/supabase/stabilization_patch.sql`, and the known `person_images.image_url` schema-cache error.
- Expo bundle returned HTTP 200 with 22,100,896 bytes.
- Secret scan returned no app-side service-role matches.

Conclusion:
- Save Look no longer loses the user-visible failure message if local fallback storage also fails.
- Live persistence proof remains blocked by the unapplied Supabase patch.
## 2026-05-11T16:41 - Avatar Local-Newer Reload Preference Proof

Changed evidence:
- `fitshelf-app/src/lib/storage.ts` now includes `isLocalNewer()`.
- `loadAvatarMeasurements()` maps the Supabase row to `remote`, then returns local fallback measurements when `fallback.updatedAt` is newer than `remote.updatedAt`.
- `tests/test_fitshelf_app_static.py` guards this avatar reload preference.

Commands:
- `npm run typecheck` in `fitshelf-app/`
- `py -m pytest tests/test_fitshelf_backend.py tests/test_fitshelf_tryon.py tests/test_fitshelf_app_static.py`
- `py -m compileall ai/backend ai/fitshelf_tryon ai/scripts`
- Temporary backend health/schema/db probe on port 8090
- Temporary Expo bundle smoke on port 8170
- `rg "SUPABASE_SERVICE_ROLE_KEY|SERVICE_ROLE" fitshelf-app -n`

Results:
- TypeScript passed.
- Focused pytest suite passed with 31 tests.
- Python compileall passed.
- Backend `/health` returned ok.
- Backend `/supabase/schema-health` returned `ok=false`, `patch_file=ai/supabase/stabilization_patch.sql`, and the known missing stabilization columns.
- Backend `/supabase/db-health` returned `priority_tables_ok=false`, `patch_file=ai/supabase/stabilization_patch.sql`, and the known `person_images.image_url` schema-cache error.
- Expo bundle returned HTTP 200 with 22,101,213 bytes.
- Secret scan returned no app-side service-role matches.

Conclusion:
- A newer local avatar profile should remain visible after restart/navigation when the Supabase avatar profile is older.
- Live persistence proof remains blocked by the unapplied Supabase patch.
## 2026-05-11T16:44 - Person And Wardrobe Delete Failure Consistency Proof

Changed evidence:
- `fitshelf-app/src/lib/storage.ts` now writes local person-image deletion only after Supabase `person_images` delete succeeds.
- `fitshelf-app/src/lib/storage.ts` now writes local wardrobe deletion only after Supabase `wardrobe_items` delete succeeds.
- `fitshelf-app/App.tsx` restores the person image or wardrobe item in memory if Supabase delete fails.
- Failure messages now say `Item restored locally.`
- `tests/test_fitshelf_app_static.py` guards local-write-after-Supabase-delete ordering for person and wardrobe deletes.

Commands:
- `npm run typecheck` in `fitshelf-app/`
- `py -m pytest tests/test_fitshelf_backend.py tests/test_fitshelf_tryon.py tests/test_fitshelf_app_static.py`
- `py -m compileall ai/backend ai/fitshelf_tryon ai/scripts`
- Temporary backend health/schema/db probe on port 8091
- Temporary Expo bundle smoke on port 8171
- `rg "SUPABASE_SERVICE_ROLE_KEY|SERVICE_ROLE" fitshelf-app -n`

Results:
- TypeScript passed.
- Focused pytest suite passed with 32 tests.
- Python compileall passed.
- Backend `/health` returned ok.
- Backend `/supabase/schema-health` returned `ok=false`, `patch_file=ai/supabase/stabilization_patch.sql`, and the known missing stabilization columns.
- Backend `/supabase/db-health` returned `priority_tables_ok=false`, `patch_file=ai/supabase/stabilization_patch.sql`, and the known `person_images.image_url` schema-cache error.
- Expo bundle returned HTTP 200 with 22,101,295 bytes.
- Secret scan returned no app-side service-role matches.

Conclusion:
- Failed person/wardrobe deletes no longer leave local persisted deletion ahead of Supabase.
- Live persistence proof remains blocked by the unapplied Supabase patch.
