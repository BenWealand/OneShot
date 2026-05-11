
---

# `vault/projects/fitshelf/STATUS.md`

```md
# FitShelf Status

## Current Status

Not started.

## Current Phase

Phase 1 - Local AI Try-On Prototype

## Current Focus

Build the local command-line try-on pipeline.

## Completed Phases

None.

## Active Blockers

None recorded yet.

## Next Actions

1. Create AI folder structure.
2. Create local Python prototype.
3. Implement or stub try-on interface.
4. Run first test command.
5. Log proof.

## 2026-05-10 19:13 - Checkpoint

Current Status:
Stable verified implementation reached for local AI try-on CLI, preprocessing debug artifacts, FastAPI backend, synchronous queue-compatible worker, Supabase schema draft, product image extraction utility, and existing Expo typecheck.

Current Phase:
Furthest stable verified phase: Phase 8 support surface. Phase 9 handoff files updated in this checkpoint.

Completed This Session:
- Created `ai/` folder structure.
- Added `ai/requirements.txt`.
- Added stable `run_tryon()` interface.
- Added CLI `ai/scripts/run_tryon.py`.
- Generated sample person and garment images.
- Generated local fallback try-on outputs.
- Added preprocessing normalization, garment mask placeholder, and pose debug output.
- Added FastAPI `/health`, `/tryon`, and result file endpoints.
- Added queue-compatible worker fallback.
- Added Supabase schema and storage notes.
- Added product image extraction script.
- Added focused pytest coverage.
- Verified existing Expo app typecheck still passes.

Active Blockers:
- CatVTON model integration requires a repository, weights, and configured `FITSHELF_CATVTON_COMMAND`.
- Bare `python` command resolves to a failing Microsoft Store alias in this shell; `py` and full interpreter path work.
- Redis/Supabase live environment checks require configured services.

Next Actions:
1. Install/configure CatVTON and set `FITSHELF_CATVTON_COMMAND`.
2. Replace the fallback renderer with real CatVTON inference once weights are available.
3. Add Redis/RQ behind the existing queue abstraction when Redis is available.
4. Apply `ai/supabase/schema.sql` to a Supabase project when credentials are available.

## 2026-05-10 19:16 - Mobile Connection Checkpoint

Current Status:
Added the Expo-side try-on submission surface and verified TypeScript.

Completed This Checkpoint:
- Added `TryOnPanel` to the existing FitShelf app.
- Added `submitTryOn()` multipart backend client.
- Added `TryOnCategory` type.
- Wired the panel into `App.tsx` after the outfit builder.
- Re-ran `npm run typecheck` successfully.

Active Blockers:
- Full mobile runtime proof requires starting Expo and a reachable backend URL for the target device/emulator.
- Real AI output still requires CatVTON installation and weights.

Next Actions:
1. Start the FastAPI backend with `py -m uvicorn ai.backend.app:app --host 0.0.0.0 --port 8000`.
2. Start Expo and set the Try-On panel backend URL to the machine LAN URL if testing on a physical device.
3. Run a live mobile submit with real photos once CatVTON is configured or accept fallback output for integration testing.

## 2026-05-10 19:43 - CatVTON Integration Checkpoint

Current Status:
CatVTON is installed, configured, and integrated into the existing FitShelf pipeline through `FITSHELF_CATVTON_COMMAND`.

Completed This Checkpoint:
- Cloned official CatVTON into `ai/vendor/CatVTON`.
- Added `ai/scripts/run_catvton.py` FitShelf adapter.
- Added `ai/scripts/setup_catvton.ps1`.
- Added `ai/requirements-catvton-windows.txt`.
- Added `ai/CATVTON.md`.
- Created local Python 3.9 CatVTON venv at `ai/.venv-catvton`.
- Installed CUDA Torch 2.4.0 / TorchVision 0.19.0 for CUDA 12.1.
- Downloaded model snapshots under `ai/models`.
- Ran standalone real CatVTON inference successfully.
- Ran existing `run_tryon.py` successfully with `backend=catvton-external`.

Active Blockers:
- CatVTON's CC BY-NC-SA license limits use to non-commercial unless separate rights are obtained.
- Full-quality inference should be tested with realistic person/garment images and production settings beyond the 1-step smoke test.

Next Actions:
1. Use production-like settings, such as `CATVTON_WIDTH=768`, `CATVTON_HEIGHT=1024`, and `CATVTON_STEPS=50`, for quality evaluation.
2. Verify memory behavior on the RTX 4070 Laptop GPU with real user photos.
3. If FitShelf is commercialized, replace CatVTON or obtain commercial rights.

## 2026-05-10 20:06 - Local API And App Flow Checkpoint

Current Status:
Usable local API + Expo app flow is implemented and verified against CatVTON smoke inference.

Completed This Checkpoint:
- Verified CatVTON environment still works with CUDA.
- Confirmed FastAPI `/tryon` returns `backend=catvton-external` when `FITSHELF_CATVTON_COMMAND` is set.
- Added local job status registry and `GET /jobs/{job_id}`.
- Added backend startup docs for CatVTON smoke settings.
- Updated root `.env.example` and `fitshelf-app/.env.example`.
- Improved Expo Try-On panel into a complete flow: select person image, select garment image, choose category, submit, show job/backend status, display result.
- Added backend API regression test.
- Ran backend smoke, app typecheck, compile check, and focused pytest.

Active Blockers:
- No blocker for local API/app smoke flow.
- Physical device testing may need LAN backend URL instead of `127.0.0.1`.
- CatVTON remains non-commercial unless separate rights are obtained.

Next Actions:
1. Run the Expo app on the target device and submit through the Try-On panel against the local backend.
2. Test quality settings with `CATVTON_WIDTH=768`, `CATVTON_HEIGHT=1024`, and `CATVTON_STEPS=50`.
3. Replace the in-memory job registry with Redis/RQ when async worker behavior is required.

## 2026-05-10T23:56 - Backend Env And CatVTON Quality Checkpoint

Current Status:
Backend environment configuration is now app-env driven, the Windows backend startup path is scripted, and the CatVTON corruption root cause is narrowed to the 1-step smoke setting. Quality-oriented backend defaults are configured in `ai/backend/.env` and examples.

Completed This Checkpoint:
- Added `ai/backend/config.py` for `.env` loading and typed backend/CatVTON settings.
- Added `ai/backend/.env.example` and local `ai/backend/.env`.
- Added `ai/scripts/start_backend.ps1` for Windows PowerShell startup from the repo root.
- Updated backend docs with exact startup commands and env precedence.
- Updated CatVTON docs with controlled quality experiment results.
- Changed CatVTON inference to receive original input images while preserving normalized debug artifacts.
- Changed default CatVTON mixed precision to `no` and backend quality defaults to `768x1024`, `50` steps.
- Verified backend startup from `C:\Users\benwe\Projects\OneShot` on port 8010 via `/health`.
- Saved controlled comparison outputs under `ai/outputs/catvton-quality/`.

Active Blockers:
- Full repo `py -m pytest` still has 9 non-FitShelf platform failures on this Windows environment; FitShelf-specific tests pass.
- CatVTON remains CC BY-NC-SA/non-commercial unless separate rights are obtained.
- Physical phone testing may still require the workstation LAN IP/hotspot URL in the Expo app.

Next Actions:
1. Use `.\ai\scripts\start_backend.ps1` for local backend startup.
2. Use `CATVTON_STEPS=8` or higher for visual checks; keep `50` for quality-oriented backend runs.
3. Run another phone submit against the hotspot/LAN backend URL using the new app env defaults.

## 2026-05-11T00:36 - 2D Product Loop And 3D Avatar Foundation Checkpoint

Current Status:
The current CatVTON 2D product loop has Preview/HD render modes, visible app loading/error handling, local generated-look history, and backend render metadata. A 3D avatar foundation is added without replacing CatVTON.

Completed This Checkpoint:
- Added backend render modes: `preview` (`384x512`, 8 steps, `fp16`) and `hd` (`768x1024`, 50 steps, no mixed precision).
- Added render mode, width, height, steps, precision, backend, and elapsed time to job responses.
- Added CatVTON subprocess timeout protection.
- Added app render-mode controls, loading/progress copy, retry-oriented error messaging, local saved-look history, and preview-to-HD rerender actions.
- Added local generated-look persistence through AsyncStorage.
- Added React Three Fiber / Expo GL 3D avatar section.
- Added a default `.glb` avatar asset at `fitshelf-app/assets/avatar/default-mannequin.glb`.
- Added rotate and zoom controls.
- Added local avatar measurement profile fields for height, chest, waist, hips, inseam, and shoulder width.
- Added local avatar measurement save/load.
- Updated backend and app docs with startup, render-mode, and physical-device steps.

Active Blockers:
- `npm audit --audit-level=moderate` reports 4 moderate Expo/Metro/PostCSS advisories with no non-breaking fix available from the current Expo SDK path.
- Full repo `py -m pytest` remains known to have unrelated platform failures from the previous checkpoint; FitShelf-focused backend tests pass.
- Physical-device verification still requires the operator to run Expo on the phone and use the workstation hotspot/LAN URL.

Next Actions:
1. Run a physical phone Preview render, confirm it saves into Saved Looks, then use `HD` on that saved Preview.
2. Adjust avatar visual styling or replace the placeholder `.glb` with a real mannequin GLB when a production asset is chosen.
3. Keep CatVTON as the 2D try-on renderer; do not start 3D garment simulation until explicitly scoped.

## 2026-05-11T01:22 - Supabase Persistence, Avatar Customization, And UI Checkpoint

Current Status:
FitShelf now keeps Expo public Supabase config separate from backend service-role config, can upload generated CatVTON results to Supabase Storage through the backend, has Supabase schema support for saved looks and avatar profiles, and has a more complete app loop for saved looks and avatar customization.

Completed This Checkpoint:
- Verified `fitshelf-app/.env` contains `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY`, and does not contain `SUPABASE_SERVICE_ROLE_KEY`.
- Verified `ai/backend/.env` contains `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, and `SUPABASE_TRYON_BUCKET`.
- Added backend Supabase Storage upload using the service-role key from backend env only.
- API/job payloads now include Supabase result URL when upload/signing succeeds, with local result URL fallback.
- Added `saved_looks` and `avatar_profiles` schema with RLS policies and setup docs.
- Added Expo-side Supabase persistence for saved looks and avatar profiles when authenticated/configured, with local AsyncStorage fallback.
- Increased Preview mode to 20 steps.
- Improved app navigation into Try-On, Avatar, Closet, and Outfits sections.
- Improved Saved Looks with multiple entries, naming, deleting, selected detail display, metadata, and HD rerender action.
- Improved Avatar with male/female modes, height/weight/chest/waist/hips/shoulder width/inseam controls, sliders plus numeric inputs, local/Supabase persistence, and a larger generated default `.glb`.

Active Blockers:
- Physical-device Supabase persistence was not live-tested in this session.
- Full repo pytest remains known to include unrelated platform failures; FitShelf-focused tests pass.
- `npm audit` still reports moderate Expo/Metro/PostCSS advisories from the current Expo SDK dependency tree.

Next Actions:
1. Apply `ai/supabase/schema.sql` in the Supabase SQL editor and create/configure the Storage bucket named by `SUPABASE_TRYON_BUCKET`.
2. Run a physical phone Preview render, confirm the result URL is Supabase-backed when backend Storage is configured, and verify Saved Looks persists after app restart/sign-in.
3. Replace the generated default avatar GLB with a production-quality rigged asset when 3D polish is in scope.

## 2026-05-11T01:34 - Supabase Auth And Storage Verification Checkpoint

Current Status:
Supabase key placement is verified, the backend private-bucket upload/signing check passes live, and the Expo app now has session restoration, sign out, sync status indicators, and a Test Supabase action.

Completed This Checkpoint:
- Re-inspected `ai/supabase/schema.sql` for `profiles`, `saved_looks`, `avatar_profiles`, `tryon_jobs`, RLS policies, and private Storage signed URL flow support.
- Rewrote Supabase setup docs with exact schema, private bucket, env, and smoke-check steps.
- Added backend `/supabase/health` endpoint that checks env presence, bucket existence, probe upload, and signed URL creation without exposing secrets.
- Added signed URL refresh behavior for job status when `supabase_storage_path` exists.
- Added Supabase session restoration and auth state handling in the app.
- Added sign-out behavior that leaves the signed-in workspace and returns to fallback/auth mode.
- Added app indicators for signed-in/local mode, Supabase configured/local fallback, and sync/test status.
- Added `Test Supabase` action in the app.
- Hardened app Saved Looks and Avatar profile writes so local data is preserved if Supabase write fails.
- Added useful result-image error handling that refreshes job status when a signed URL fails to load.

Active Blockers:
- App-side authenticated database persistence still needs physical-device/user-session verification.
- Full repo pytest remains known to include unrelated platform failures; FitShelf-focused tests pass.
- `npm audit` still reports moderate Expo/Metro/PostCSS advisories from the current Expo SDK dependency tree.

Next Actions:
1. On the phone, sign up/sign in, tap `Test Supabase`, and verify it reports sync availability.
2. Run Preview/HD, save/rename/delete a Saved Look, restart the app, and verify persistence.
3. Save Avatar profile measurements, restart the app, and verify local/Supabase reload.
## 2026-05-11T02:17 - Signed Result Display And Avatar Upgrade Checkpoint

Current status:
- Backend result payloads now expose separate local fallback, private Supabase storage path, and Supabase signed display URL fields.
- Expo try-on display now chooses image URLs in priority order: Supabase signed URL, refreshed signed URL, then local backend result URL.
- Saved Looks now keep permanent `resultStoragePath` and `localResultUrl` alongside the last display URL, so signed URLs are not the only source of truth.
- Backend has `GET /supabase/sign?storage_path=...` to regenerate a signed URL for a private result object.
- Signed URL default expiration is now 30 days.
- The result image view clears stale image state, changes the React Native image key, appends a cache-busting query parameter, shows dev-only URL source text, and falls back to local backend URLs when refresh fails.
- Avatar viewer now uses React Three Fiber native, Drei native `useGLTF`, Expo GL-compatible Metro config, a regenerated neutral mannequin `.glb`, visible loading/error states, and an in-canvas procedural fallback.
- Avatar controls still support male/female modes plus height, weight, chest, waist, hips, shoulder width, and inseam with sliders and numeric inputs.

Verified:
- `npm run typecheck` from `fitshelf-app` passed.
- `py -m pytest tests/test_fitshelf_backend.py tests/test_fitshelf_tryon.py` passed with 8 tests.
- `py -m compileall ai/backend ai/fitshelf_tryon ai/scripts` passed.
- Live backend Supabase smoke passed for `/supabase/health` and `/supabase/sign`.
- Expo Metro bundle request passed on localhost with the updated R3F/Drei/native avatar code.

Remaining caveats:
- Physical-device confirmation is still needed for actual React Native image rendering against fresh and expired signed URLs.
- Expo Go GLB behavior can vary by device; the procedural fallback is implemented for this case.
## 2026-05-11T03:00 - Overnight Product Hardening Checkpoint

Current status:
- Supabase auth/profile creation is hardened. Sign-in/session restore now calls profile upsert, signup reports email confirmation state, and the app has separate `Test Supabase` and `Test DB Write` actions.
- App database writes now target the schema tables that actually exist: `profiles`, `person_images`, `wardrobe_items`, `tryon_jobs`, `saved_looks`, and `avatar_profiles`.
- New app-generated person and wardrobe IDs are UUIDs so they can insert into Supabase UUID columns.
- Local fallback no longer silently hides important write failures; storage functions now throw sanitized table-specific errors for failed Supabase writes.
- Private bucket signed URL display was fixed. Supabase sign responses returning `/object/sign/...` are now converted to `/storage/v1/object/sign/...`; direct signed URLs and backend proxy URLs both return 200.
- Backend now has `/supabase/db-health`, `/supabase/object`, `/product/images`, and `/debug/config`.
- Try-on result UI now supports signed URL refresh, backend private-object proxy fallback, load diagnostics, cache-busting, and side-by-side before/result comparison.
- Runtime avatar fallback no longer uses `CapsuleGeometry`; measurement-derived scales are clamped to finite safe ranges. The primary avatar path remains GLB-first via R3F native and Drei native.
- CatV2TON official repo was cloned to `ai/vendor/CatV2TON`, researched, and documented in `ai/CATV2TON.md`. It is exposed as an optional disabled backend, not enabled over CatVTON.
- Wardrobe/person libraries now include editable person labels, wardrobe filters, editable brand/color/notes, favorite, delete, and product URL import.

Verified:
- `npm run typecheck` passed.
- `py -m pytest tests/test_fitshelf_backend.py tests/test_fitshelf_tryon.py` passed with 9 tests.
- `py -m compileall ai/backend ai/fitshelf_tryon ai/scripts` passed.
- `ai/.venv-catvton/Scripts/python.exe ai/scripts/run_catv2ton.py --check` passed for dependency visibility and CUDA.
- Live backend smoke passed for `/health`, `/debug/config`, `/supabase/health`, `/supabase/db-health`, `/supabase/sign`, direct signed URL open, and `/supabase/object`.
- Expo Metro bundle smoke passed with a 22,020,445-byte bundle.
- No service-role key references were found in `fitshelf-app`.

Remaining caveats:
- App-side authenticated RLS writes still need a real signed-in phone session to press `Test DB Write` and confirm rows in Supabase.
- CatV2TON inference is not enabled because upstream uses VITONHD/DressCode dataset-style inference with DensePose/mask conditions, not a direct single-image CLI.
- Physical-device avatar GLB rendering still needs operator confirmation; the fallback should now fail gracefully without CapsuleGeometry NaN errors.
## 2026-05-11T10:50 - Focused Stabilization Pass

Current status:
- App-side `Test DB Write` now verifies all three priority tables through the signed-in anon-key session: `profiles`, `avatar_profiles`, and `saved_looks`.
- App-side Supabase errors remain sanitized and table-specific so RLS/schema failures are visible instead of hidden behind local fallback.
- Signed image retry now avoids a refresh loop: if a signed URL fails twice for the same `supabase_storage_path`, the app switches to the backend private-object proxy.
- Signed URL path regression is covered by a backend unit test. Supabase relative signed paths are normalized to `/storage/v1/object/sign/...`.
- Avatar GLB loading now resolves the bundled `.glb` through `expo-asset` before passing a URI to Drei native `useGLTF`.
- Runtime avatar fallback remains non-capsule and all measurement-derived values are clamped to finite positive ranges.

Verified:
- `py -m pytest tests/test_fitshelf_backend.py tests/test_fitshelf_tryon.py` passed with 10 tests.
- `py -m compileall ai/backend ai/fitshelf_tryon ai/scripts` passed.
- `npm run typecheck` passed.
- Live backend Supabase smoke passed for `/health`, `/supabase/health`, `/supabase/db-health`, `/supabase/sign`, direct signed URL fetch, and `/supabase/object`.
- Expo bundle smoke passed.
- No service-role key references were found in `fitshelf-app`.

Remaining caveat:
- A physical signed-in Expo session is still required to press `Test DB Write` and visually confirm rows appear from the anon-key client on the target phone.
## 2026-05-11T11:13 - Expo Supabase Email Redirect Fix

Current status:
- Expo deep-link auth callback support is implemented with `expo-linking`.
- `fitshelf-app/app.json` now declares the production app scheme `fitshelf`.
- Supabase signup now passes `emailRedirectTo` using the current Expo-generated `auth/callback` URL.
- App startup and link events now handle Supabase callbacks containing either `code=...` or `#access_token=...&refresh_token=...`.
- Email confirmation UI now tells the operator to open the verification link on the device and displays the exact redirect URL to add to Supabase.
- Supabase setup docs now explain Dashboard `Authentication -> URL Configuration`, Site URL, Redirect URLs, Expo Go LAN/tunnel URLs, and production `fitshelf://auth/callback`.

Verified:
- `npm run typecheck` passed.
- `py -m pytest tests/test_fitshelf_backend.py tests/test_fitshelf_tryon.py` passed with 10 tests.
- `py -m compileall ai/backend ai/fitshelf_tryon ai/scripts` passed.
- Expo bundle smoke passed after adding `expo-linking`.
- No service-role key references were found in `fitshelf-app`.

Remaining caveat:
- A real email confirmation link must be tested from the phone after adding the exact in-app redirect URL to Supabase Dashboard.
## 2026-05-11T11:59 - Persistence And Avatar Control Stabilization

Current status:
- Try-On now exposes explicit `Save Person`, `Save Garment`, and `Save Look` actions.
- Preview/HD rendering still records the `tryon_jobs` row as soon as a result is returned; `saved_looks` rows are written when the operator taps `Save Look`.
- `Test DB Write` now exercises the priority app-side RLS tables through the signed-in anon-key session: `profiles`, `person_images`, `wardrobe_items`, `tryon_jobs`, `saved_looks`, and `avatar_profiles`.
- `saved_looks.tryon_job_id` was added to the schema so saved looks can link to the completed try-on job that the app already sends.
- Supabase save errors for `saved_looks` and `avatar_profiles` now use the same sanitized table-specific error format as the other persistence paths.
- Avatar rotate/zoom buttons were replaced with touch drag rotation and pinch zoom. The GLB remains the primary path, with the non-capsule fallback only for asset/model load failure.
- The avatar screen now states that the bundled GLB has no rigged body morphs, so measurement controls are approximate instead of pretending to drive unsupported morph targets.

Verified:
- `npm run typecheck` passed.
- `py -m pytest tests/test_fitshelf_backend.py tests/test_fitshelf_tryon.py` passed with 10 tests.
- `py -m compileall ai/backend ai/fitshelf_tryon ai/scripts` passed.
- Live backend smoke on temporary port 8015 returned `/health=ok`, Supabase Storage configured/bucket/upload/sign all true, and Supabase DB profile write/read/delete all true.
- Expo bundle smoke on temporary port 8097 returned HTTP 200 with a 22,071,369-byte bundle.
- `rg "SUPABASE_SERVICE_ROLE_KEY|SERVICE_ROLE" fitshelf-app -n` returned no matches.

Remaining caveat:
- A real signed-in phone session is still needed to tap the new Save Person, Save Garment, Save Look, and Test DB Write actions and confirm rows in Supabase from the device.
## 2026-05-11T12:08 - Persistence Failure Visibility And Asset Bucket Fix

Current status:
- Signed-in Supabase reload failures for person images, wardrobe items, saved looks, and avatar profiles now surface in the UI instead of silently falling back to stale local data.
- `Save Look` no longer marks a look as synced or clears the error when Supabase save fails; it only changes to `Look Saved` after `tryon_jobs` and `saved_looks` writes complete.
- Saved Look rename/delete failures are now caught and shown in the Try-On panel.
- Person/garment Supabase table rows are only written for records with a real `fitshelf-assets` storage path. If asset upload fails, the item remains local and the storage error remains visible.
- `ai/supabase/schema.sql` now creates the public `fitshelf-assets` bucket, the private `tryon-results` bucket, and a storage object policy that restricts app-uploaded asset paths to the signed-in `user_id` prefix.
- The live Supabase project was missing `fitshelf-assets`; it was created through the Storage API with the backend service-role key. Latest backend health now reports both result and asset buckets present.
- Backend `/supabase/health` now reports `asset_bucket_exists` for `fitshelf-assets`.

Verified:
- `npm run typecheck` passed.
- `py -m pytest tests/test_fitshelf_backend.py tests/test_fitshelf_tryon.py` passed with 10 tests.
- `py -m compileall ai/backend ai/fitshelf_tryon ai/scripts` passed.
- Live backend smoke on temporary port 8017 returned `/health=ok`, `tryon-results` exists, `fitshelf-assets` exists, Supabase upload/sign true, and DB profile write/read/delete true.
- Expo bundle smoke on temporary port 8098 returned HTTP 200 with a 22,073,195-byte bundle.
- `rg "SUPABASE_SERVICE_ROLE_KEY|SERVICE_ROLE" fitshelf-app -n` returned no matches.

Remaining caveat:
- The bucket exists now, but the latest `ai/supabase/schema.sql` still needs to be applied in Supabase SQL editor if the `fitshelf assets own objects` storage policy is not already present.
## 2026-05-11T12:14 - Default GLB Mannequin Replacement

Current status:
- The bundled `default-mannequin.glb` was regenerated from a smoother mesh-based mannequin source instead of the previous capsule-based placeholder.
- `fitshelf-app/scripts/generate-avatar-glb.mjs` no longer imports or uses `CapsuleGeometry`.
- The Avatar panel no longer renders the procedural avatar during normal GLB loading. It shows the loading overlay until the GLB loads, and only renders the procedural fallback after a hard GLB/asset failure.
- The avatar status now reports `Loading`, `GLB`, `Fallback`, or `Saved`.

Verified:
- Regenerated `fitshelf-app/assets/avatar/default-mannequin.glb` at 517,380 bytes.
- Parsed the GLB with Three.js `GLTFLoader`: 19 meshes, root `FitShelfDefaultGlbMannequin`, 0 non-finite vertices.
- `rg "CapsuleGeometry" fitshelf-app/src fitshelf-app/scripts -n` returned no matches.
- `npm run typecheck` passed.
- `py -m pytest tests/test_fitshelf_backend.py tests/test_fitshelf_tryon.py` passed with 10 tests.
- `py -m compileall ai/backend ai/fitshelf_tryon ai/scripts` passed.
- Live backend smoke on temporary port 8018 passed.
- Expo bundle smoke on temporary port 8099 returned HTTP 200 with a 22,072,875-byte bundle.
- `rg "SUPABASE_SERVICE_ROLE_KEY|SERVICE_ROLE" fitshelf-app -n` returned no matches.

Remaining caveat:
- Physical-device Expo GLB rendering still needs confirmation on the target phone.
## 2026-05-11T12:19 - App-Side Asset Upload Debug Action

Current status:
- The visible sync/debug panel now includes `Test Asset Upload`.
- `Test Asset Upload` uses the signed-in anon-key session to upload and delete a harmless text object under `<user_id>/_debug/` in the `fitshelf-assets` bucket.
- This checks the exact Storage permission layer needed by Save Person and Save Garment before using real photos.
- README and Supabase setup docs now mention the new asset upload debug action.

Verified:
- `npm run typecheck` passed.
- `py -m pytest tests/test_fitshelf_backend.py tests/test_fitshelf_tryon.py` passed with 10 tests.
- `py -m compileall ai/backend ai/fitshelf_tryon ai/scripts` passed.
- Live backend smoke on temporary port 8019 passed: `/health=ok`, result bucket exists, asset bucket exists, Supabase upload/sign true, DB profile write/read/delete true.
- Expo bundle smoke on temporary port 8100 returned HTTP 200 with a 22,076,527-byte bundle.
- `rg "SUPABASE_SERVICE_ROLE_KEY|SERVICE_ROLE" fitshelf-app -n` returned no matches.

Remaining caveat:
- The new `Test Asset Upload` action still needs a signed-in physical phone run after the latest Supabase storage policy is applied.
## 2026-05-11T12:23 - Result Image Fallback Tightening

Current status:
- Result image error recovery now derives a backend private-object proxy URL from `supabase_storage_path` when needed.
- After a signed image load failure, the app now prefers backend proxy/local fallback immediately when available instead of repeatedly presenting another refreshed signed URL that may still render blank in React Native.
- Saved Look open still refreshes from durable `resultStoragePath`, preserving the storage path as source of truth.

Verified:
- `npm run typecheck` passed.
- `py -m pytest tests/test_fitshelf_backend.py tests/test_fitshelf_tryon.py` passed with 10 tests.
- `py -m compileall ai/backend ai/fitshelf_tryon ai/scripts` passed.
- Live backend smoke on temporary port 8021 passed.
- Expo bundle smoke on temporary port 8101 returned HTTP 200 with a 22,078,186-byte bundle.
- `rg "SUPABASE_SERVICE_ROLE_KEY|SERVICE_ROLE" fitshelf-app -n` returned no matches.

Remaining caveat:
- Physical-device React Native Image rendering still needs confirmation for the signed URL failure path, proxy fallback, and reopened Saved Looks.
## 2026-05-11T12:26 - Manual Builder Labeling

Current status:
- The legacy `outfits` tab is now labeled `manual`.
- The screen now states that manual builder drafts stay on-device and that Try-On Saved Looks are the Supabase-backed generated results.
- Saved outfit list heading changed to `Manual Drafts`.
- Header summary now reports `manual drafts` instead of implying persisted cloud outfits.

Verified:
- `npm run typecheck` passed.
- `py -m pytest tests/test_fitshelf_backend.py tests/test_fitshelf_tryon.py` passed with 10 tests.
- `py -m compileall ai/backend ai/fitshelf_tryon ai/scripts` passed.
- Live backend smoke on temporary port 8022 passed.
- Expo bundle smoke on temporary port 8102 returned HTTP 200 with a 22,079,165-byte bundle.
- `rg "SUPABASE_SERVICE_ROLE_KEY|SERVICE_ROLE" fitshelf-app -n` returned no matches.

Remaining caveat:
- Manual builder drafts remain local-only by design in this stabilization pass. Supabase-backed generated result persistence is through Try-On Saved Looks.
## 2026-05-11T12:29 - Full Supabase DB Health Check And Schema Patch

Current status:
- Backend `/supabase/db-health` now checks all priority persistence tables, not just `profiles`.
- The check writes/reads/deletes harmless records across `person_images`, `wardrobe_items`, `tryon_jobs`, `saved_looks`, and `avatar_profiles`, including `saved_looks.tryon_job_id`.
- Live DB health found the current Supabase schema is missing `person_images.image_url`, which explains why Save Person cloud persistence would fail until the latest schema is applied.
- Added `ai/supabase/stabilization_patch.sql`, an idempotent SQL patch for existing projects that adds the latest columns and `fitshelf-assets` storage policy.

Verified:
- `npm run typecheck` passed.
- `py -m pytest tests/test_fitshelf_backend.py tests/test_fitshelf_tryon.py` passed with 10 tests.
- `py -m compileall ai/backend ai/fitshelf_tryon ai/scripts` passed.
- Live backend smoke on temporary port 8023 returned health/storage ok, but `/supabase/db-health` failed with `person_images write returned 400: Could not find the 'image_url' column of 'person_images' in the schema cache`.
- Expo bundle smoke on temporary port 8103 returned HTTP 200 with a 22,079,165-byte bundle.
- `rg "SUPABASE_SERVICE_ROLE_KEY|SERVICE_ROLE" fitshelf-app -n` returned no matches.

Active blocker:
- Apply `ai/supabase/stabilization_patch.sql` or latest `ai/supabase/schema.sql` in Supabase SQL editor, then rerun `/supabase/db-health` until `priority_tables_ok=true`.
## 2026-05-11T12:35 - Debug Check Cleanup Hardening

Current status:
- Backend `/supabase/db-health` now attempts cleanup of transient health-check rows even when a later priority-table write/read/delete fails.
- App `Test DB Write` now attempts cleanup of transient test rows on failure.
- App `Test DB Write` now preserves the user's existing `avatar_profiles` row, restores it after the test, or deletes the temporary avatar row if none existed before.

Verified:
- `npm run typecheck` passed.
- `py -m pytest tests/test_fitshelf_backend.py tests/test_fitshelf_tryon.py` passed with 10 tests.
- `py -m compileall ai/backend ai/fitshelf_tryon ai/scripts` passed.
- Live backend smoke on temporary port 8024 still identifies the active live schema blocker: missing `person_images.image_url`.
- Expo bundle smoke on temporary port 8104 returned HTTP 200 with a 22,079,222-byte bundle.
- `rg "SUPABASE_SERVICE_ROLE_KEY|SERVICE_ROLE" fitshelf-app -n` returned no matches.

Active blocker:
- Live Supabase still needs `ai/supabase/stabilization_patch.sql` applied before final phone persistence proof.
## 2026-05-11T12:38 - Read-Only Schema Health Endpoint

Current status:
- Added `GET /supabase/schema-health`.
- The endpoint checks required priority tables/columns without writing rows.
- Supabase setup docs now include the schema health check and expected `{ ok: true, missing: [] }` result.
- Live schema health confirms the project is still missing stabilization patch columns before phone persistence can pass.

Verified:
- `npm run typecheck` passed.
- `py -m pytest tests/test_fitshelf_backend.py tests/test_fitshelf_tryon.py` passed with 11 tests.
- `py -m compileall ai/backend ai/fitshelf_tryon ai/scripts` passed.
- Live backend smoke on temporary port 8025 returned `schema.ok=false` with missing entries for `person_images`, `wardrobe_items`, and `saved_looks`.
- Expo bundle smoke on temporary port 8105 returned HTTP 200 with a 22,079,222-byte bundle.
- `rg "SUPABASE_SERVICE_ROLE_KEY|SERVICE_ROLE" fitshelf-app -n` returned no matches.

Active blocker:
- Run `ai/supabase/stabilization_patch.sql`, then verify `/supabase/schema-health` returns `ok=true` and `/supabase/db-health` returns `priority_tables_ok=true`.
## 2026-05-11T12:42 - Exact Schema Missing List

Current status:
- `/supabase/schema-health` now checks required columns individually instead of stopping at the first missing column per table.
- Live schema health now returns the exact missing stabilization columns:
  - `person_images.label`
  - `person_images.image_url`
  - `wardrobe_items.color`
  - `wardrobe_items.favorite`
  - `wardrobe_items.image_url`
  - `saved_looks.tryon_job_id`
  - `saved_looks.result_storage_path`
  - `saved_looks.local_result_url`

Verified:
- `npm run typecheck` passed.
- `py -m pytest tests/test_fitshelf_backend.py tests/test_fitshelf_tryon.py` passed with 11 tests.
- `py -m compileall ai/backend ai/fitshelf_tryon ai/scripts` passed.
- Live backend smoke on temporary port 8026 returned the exact missing list above.
- Expo bundle smoke on temporary port 8106 returned HTTP 200 with a 22,079,222-byte bundle.
- `rg "SUPABASE_SERVICE_ROLE_KEY|SERVICE_ROLE" fitshelf-app -n` returned no matches.

Active blocker:
- Apply `ai/supabase/stabilization_patch.sql` in Supabase SQL editor.
## 2026-05-11T13:05 - Latest Checkpoint Pointer

Current status:
- Latest code change is the visible schema-blocked save message in Try-On.
- Verification at 13:05 is recorded in `PROOF.md`, `BLOCKERS.md`, `DECISIONS.md`, and `RESUME.md`.
- The active blocker is unchanged: apply `ai/supabase/stabilization_patch.sql`, then run backend schema/db health and physical-device tests.
## 2026-05-11T15:44 - Rename Failure Wording Checkpoint

Current status:
- Saved-look rename failures now explicitly say the rename was not saved to Supabase and only the local name was kept.
- Focused verification still passes with 30 tests, TypeScript, Python compileall, Expo bundle smoke, and app-side service-role scan.
- Live backend schema/db health still fails until `ai/supabase/stabilization_patch.sql` is applied.

Active blocker:
- Apply `ai/supabase/stabilization_patch.sql`, then run backend schema/db health and the physical-phone persistence/avatar/result-image proof.
- Product-ingestion and advanced fit/recommendation phases remain queued until stabilization and the prior wardrobe/product-ingestion phase pass completion audits.
## 2026-05-11T15:48 - Closet Edit/Delete Failure Wording Checkpoint

Current status:
- Person image and wardrobe edit/delete failures now explicitly say the Supabase change was not saved while the local list/edit was kept.
- Focused verification still passes with 30 tests, TypeScript, Python compileall, Expo bundle smoke, and app-side service-role scan.
- Live backend schema/db health still fails until `ai/supabase/stabilization_patch.sql` is applied.

Active blocker:
- Apply `ai/supabase/stabilization_patch.sql`, then run backend schema/db health and the physical-phone persistence/avatar/result-image proof.
- Product-ingestion and advanced fit/recommendation phases remain queued until stabilization and the prior wardrobe/product-ingestion phase pass completion audits.
## 2026-05-11T15:51 - Saved Look Delete Failure Wording Checkpoint

Current status:
- Saved Look delete failures now explicitly say Supabase was not updated while the local list was kept.
- Focused verification still passes with 30 tests, TypeScript, Python compileall, Expo bundle smoke, and app-side service-role scan.
- Live backend schema/db health still fails until `ai/supabase/stabilization_patch.sql` is applied.

Completion audit:
- The stabilization objective is not complete because live Supabase persistence and physical-device proof are still missing.
- There is no DDL-capable database URL, Supabase CLI link, or interactive SQL editor access in this shell, so the patch cannot be applied here.

Active blocker:
- Apply `ai/supabase/stabilization_patch.sql`, then run backend schema/db health and the physical-phone persistence/avatar/result-image proof.
- Product-ingestion and advanced fit/recommendation phases remain queued until stabilization and the prior wardrobe/product-ingestion phase pass completion audits.
## 2026-05-11T15:55 - Saved Look Delete Storage Ordering Checkpoint

Current status:
- Saved Look delete now writes local storage only after the Supabase delete succeeds.
- Focused verification now passes with 31 tests, TypeScript, Python compileall, Expo bundle smoke, and app-side service-role scan.
- Live backend schema/db health still fails until `ai/supabase/stabilization_patch.sql` is applied.

Completion audit:
- The stabilization objective is not complete because live Supabase persistence and physical-device proof are still missing.
- There is no DDL-capable database URL, Supabase CLI link, or interactive SQL editor access in this shell, so the patch cannot be applied here.

Active blocker:
- Apply `ai/supabase/stabilization_patch.sql`, then run backend schema/db health and the physical-phone persistence/avatar/result-image proof.
- Product-ingestion and advanced fit/recommendation phases remain queued until stabilization and the prior wardrobe/product-ingestion phase pass completion audits.
## 2026-05-11T15:59 - Manual Auth Session Recovery Checkpoint

Current status:
- The auth screen now has a `Check session` action for users who manually return to FitShelf after email verification.
- Focused verification still passes with 31 tests, TypeScript, Python compileall, Expo bundle smoke, and app-side service-role scan.
- Live backend schema/db health still fails until `ai/supabase/stabilization_patch.sql` is applied.

Completion audit:
- The stabilization objective is not complete because live Supabase persistence and physical-device proof are still missing.
- There is no DDL-capable database URL, Supabase CLI link, or interactive SQL editor access in this shell, so the patch cannot be applied here.

Active blocker:
- Apply `ai/supabase/stabilization_patch.sql`, then run backend schema/db health and the physical-phone persistence/avatar/result-image proof.
- Product-ingestion and advanced fit/recommendation phases remain queued until stabilization and the prior wardrobe/product-ingestion phase pass completion audits.
## 2026-05-11T16:02 - Auth Recovery Docs And Busy State Checkpoint

Current status:
- `Check session` remains busy through profile creation.
- `fitshelf-app/README.md` now documents `Check session` in the email verification recovery flow and physical phone checklist.
- Focused verification still passes with 31 tests, TypeScript, Python compileall, Expo bundle smoke, and app-side service-role scan.
- Live backend schema/db health still fails until `ai/supabase/stabilization_patch.sql` is applied.

Completion audit:
- The stabilization objective is not complete because live Supabase persistence and physical-device proof are still missing.
- There is no DDL-capable database URL, Supabase CLI link, or interactive SQL editor access in this shell, so the patch cannot be applied here.

Active blocker:
- Apply `ai/supabase/stabilization_patch.sql`, then run backend schema/db health and the physical-phone persistence/avatar/result-image proof.
- Product-ingestion and advanced fit/recommendation phases remain queued until stabilization and the prior wardrobe/product-ingestion phase pass completion audits.
## 2026-05-11T16:06 - Avatar Saved Status Keeps Model State Visible

Current status:
- The avatar header now keeps GLB/Fallback/Loading visible after saving the avatar profile.
- Focused verification still passes with 31 tests, TypeScript, Python compileall, Expo bundle smoke, and app-side service-role scan.
- Live backend schema/db health still fails until `ai/supabase/stabilization_patch.sql` is applied.

Completion audit:
- The stabilization objective is not complete because live Supabase persistence and physical-device proof are still missing.
- There is no DDL-capable database URL, Supabase CLI link, or interactive SQL editor access in this shell, so the patch cannot be applied here.

Active blocker:
- Apply `ai/supabase/stabilization_patch.sql`, then run backend schema/db health and the physical-phone persistence/avatar/result-image proof.
- Product-ingestion and advanced fit/recommendation phases remain queued until stabilization and the prior wardrobe/product-ingestion phase pass completion audits.
## 2026-05-11T16:09 - Restore Callback Busy State Checkpoint

Current status:
- `Restore callback` now remains busy through profile creation, matching `Check session`.
- Focused verification still passes with 31 tests, TypeScript, Python compileall, Expo bundle smoke, and app-side service-role scan.
- Live backend schema/db health still fails until `ai/supabase/stabilization_patch.sql` is applied.

Completion audit:
- The stabilization objective is not complete because live Supabase persistence and physical-device proof are still missing.
- There is no DDL-capable database URL, Supabase CLI link, or interactive SQL editor access in this shell, so the patch cannot be applied here.

Active blocker:
- Apply `ai/supabase/stabilization_patch.sql`, then run backend schema/db health and the physical-phone persistence/avatar/result-image proof.
- Product-ingestion and advanced fit/recommendation phases remain queued until stabilization and the prior wardrobe/product-ingestion phase pass completion audits.
## 2026-05-11T16:13 - Sign-In Profile Readiness Gate

Current status:
- Normal sign-in/sign-up now waits for profile creation and does not enter the app if profile creation fails.
- Focused verification still passes with 31 tests, TypeScript, Python compileall, Expo bundle smoke, and app-side service-role scan.
- Live backend schema/db health still fails until `ai/supabase/stabilization_patch.sql` is applied.

Completion audit:
- The stabilization objective is not complete because live Supabase persistence and physical-device proof are still missing.
- There is no DDL-capable database URL, Supabase CLI link, or interactive SQL editor access in this shell, so the patch cannot be applied here.

Active blocker:
- Apply `ai/supabase/stabilization_patch.sql`, then run backend schema/db health and the physical-phone persistence/avatar/result-image proof.
- Product-ingestion and advanced fit/recommendation phases remain queued until stabilization and the prior wardrobe/product-ingestion phase pass completion audits.
## 2026-05-11T16:15 - Auth State Listener Profile Gate

Current status:
- The Supabase auth-state listener now waits for profile creation/readiness before setting the app session.
- Focused verification still passes with 31 tests, TypeScript, Python compileall, Expo bundle smoke, and app-side service-role scan.
- Live backend schema/db health still fails until `ai/supabase/stabilization_patch.sql` is applied.

Completion audit:
- The stabilization objective is not complete because live Supabase persistence and physical-device proof are still missing.
- There is no DDL-capable database URL, Supabase CLI link, or interactive SQL editor access in this shell, so the patch cannot be applied here.

Active blocker:
- Apply `ai/supabase/stabilization_patch.sql`, then run backend schema/db health and the physical-phone persistence/avatar/result-image proof.
- Product-ingestion and advanced fit/recommendation phases remain queued until stabilization and the prior wardrobe/product-ingestion phase pass completion audits.
## 2026-05-11T16:18 - Startup And Incoming Callback Profile Gates

Current status:
- Startup session restore and incoming auth callback handling now wait for profile readiness before setting the app session.
- Focused verification still passes with 31 tests, TypeScript, Python compileall, Expo bundle smoke, and app-side service-role scan.
- Live backend schema/db health still fails until `ai/supabase/stabilization_patch.sql` is applied.

Completion audit:
- The stabilization objective is not complete because live Supabase persistence and physical-device proof are still missing.
- There is no DDL-capable database URL, Supabase CLI link, or interactive SQL editor access in this shell, so the patch cannot be applied here.

Active blocker:
- Apply `ai/supabase/stabilization_patch.sql`, then run backend schema/db health and the physical-phone persistence/avatar/result-image proof.
- Product-ingestion and advanced fit/recommendation phases remain queued until stabilization and the prior wardrobe/product-ingestion phase pass completion audits.
## 2026-05-11T16:21 - Explicit Avatar Profile Failure Wording

Current status:
- Avatar profile Supabase failures now explicitly say the profile was not saved to Supabase and that the local profile was kept.
- Focused verification still passes with 31 tests, TypeScript, Python compileall, Expo bundle smoke, and app-side service-role scan.
- Live backend schema/db health still fails until `ai/supabase/stabilization_patch.sql` is applied.

Completion audit:
- The stabilization objective is not complete because live Supabase persistence and physical-device proof are still missing.
- There is no DDL-capable database URL, Supabase CLI link, or interactive SQL editor access in this shell, so the patch cannot be applied here.

Active blocker:
- Apply `ai/supabase/stabilization_patch.sql`, then run backend schema/db health and the physical-phone persistence/avatar/result-image proof.
- Product-ingestion and advanced fit/recommendation phases remain queued until stabilization and the prior wardrobe/product-ingestion phase pass completion audits.
## 2026-05-11T16:24 - Save Look Local Failure Persistence

Current status:
- Save Look failure fallback now writes Saved Looks to local storage even if try-on job Supabase sync fails before saved-look sync runs.
- Focused verification still passes with 31 tests, TypeScript, Python compileall, Expo bundle smoke, and app-side service-role scan.
- Live backend schema/db health still fails until `ai/supabase/stabilization_patch.sql` is applied.

Completion audit:
- The stabilization objective is not complete because live Supabase persistence and physical-device proof are still missing.
- There is no DDL-capable database URL, Supabase CLI link, or interactive SQL editor access in this shell, so the patch cannot be applied here.

Active blocker:
- Apply `ai/supabase/stabilization_patch.sql`, then run backend schema/db health and the physical-phone persistence/avatar/result-image proof.
- Product-ingestion and advanced fit/recommendation phases remain queued until stabilization and the prior wardrobe/product-ingestion phase pass completion audits.
## 2026-05-11T16:26 - Saved Look Thumbnail Failure Visibility

Current status:
- Saved Looks gallery thumbnail failures now show a visible error instructing the tester to open the look to refresh the result image.
- Focused verification still passes with 31 tests, TypeScript, Python compileall, Expo bundle smoke, and app-side service-role scan.
- Live backend schema/db health still fails until `ai/supabase/stabilization_patch.sql` is applied.

Completion audit:
- The stabilization objective is not complete because live Supabase persistence and physical-device proof are still missing.
- There is no DDL-capable database URL, Supabase CLI link, or interactive SQL editor access in this shell, so the patch cannot be applied here.

Active blocker:
- Apply `ai/supabase/stabilization_patch.sql`, then run backend schema/db health and the physical-phone persistence/avatar/result-image proof.
- Product-ingestion and advanced fit/recommendation phases remain queued until stabilization and the prior wardrobe/product-ingestion phase pass completion audits.
## 2026-05-11T16:29 - Saved Look Open Proxy Fallback

Current status:
- Opening a Saved Look now falls back to the backend object proxy when signed URL refresh fails and a durable result storage path exists.
- Focused verification still passes with 31 tests, TypeScript, Python compileall, Expo bundle smoke, and app-side service-role scan.
- Live backend schema/db health still fails until `ai/supabase/stabilization_patch.sql` is applied.

Completion audit:
- The stabilization objective is not complete because live Supabase persistence and physical-device proof are still missing.
- There is no DDL-capable database URL, Supabase CLI link, or interactive SQL editor access in this shell, so the patch cannot be applied here.

Active blocker:
- Apply `ai/supabase/stabilization_patch.sql`, then run backend schema/db health and the physical-phone persistence/avatar/result-image proof.
- Product-ingestion and advanced fit/recommendation phases remain queued until stabilization and the prior wardrobe/product-ingestion phase pass completion audits.
## 2026-05-11T16:32 - Saved Look Refresh Fallback Copy

Current status:
- Saved Look open now distinguishes backend proxy fallback, local fallback, and no-fallback refresh failure messages.
- Focused verification still passes with 31 tests, TypeScript, Python compileall, Expo bundle smoke, and app-side service-role scan.
- Live backend schema/db health still fails until `ai/supabase/stabilization_patch.sql` is applied.

Completion audit:
- The stabilization objective is not complete because live Supabase persistence and physical-device proof are still missing.
- There is no DDL-capable database URL, Supabase CLI link, or interactive SQL editor access in this shell, so the patch cannot be applied here.

Active blocker:
- Apply `ai/supabase/stabilization_patch.sql`, then run backend schema/db health and the physical-phone persistence/avatar/result-image proof.
- Product-ingestion and advanced fit/recommendation phases remain queued until stabilization and the prior wardrobe/product-ingestion phase pass completion audits.
## 2026-05-11T16:35 - Local Fallback Reload Merge

Current status:
- Reloads now merge local fallback person images, wardrobe items, and Saved Looks after Supabase rows.
- Focused verification still passes with 31 tests, TypeScript, Python compileall, Expo bundle smoke, and app-side service-role scan.
- Live backend schema/db health still fails until `ai/supabase/stabilization_patch.sql` is applied.

Completion audit:
- The stabilization objective is not complete because live Supabase persistence and physical-device proof are still missing.
- There is no DDL-capable database URL, Supabase CLI link, or interactive SQL editor access in this shell, so the patch cannot be applied here.

Active blocker:
- Apply `ai/supabase/stabilization_patch.sql`, then run backend schema/db health and the physical-phone persistence/avatar/result-image proof.
- Product-ingestion and advanced fit/recommendation phases remain queued until stabilization and the prior wardrobe/product-ingestion phase pass completion audits.
## 2026-05-11T16:38 - Save Look Double-Failure Visibility

Current status:
- Save Look now reports if both Supabase persistence and local fallback storage fail.
- Focused verification still passes with 31 tests, TypeScript, Python compileall, Expo bundle smoke, and app-side service-role scan.
- Live backend schema/db health still fails until `ai/supabase/stabilization_patch.sql` is applied.

Completion audit:
- The stabilization objective is not complete because live Supabase persistence and physical-device proof are still missing.
- There is no DDL-capable database URL, Supabase CLI link, or interactive SQL editor access in this shell, so the patch cannot be applied here.

Active blocker:
- Apply `ai/supabase/stabilization_patch.sql`, then run backend schema/db health and the physical-phone persistence/avatar/result-image proof.
- Product-ingestion and advanced fit/recommendation phases remain queued until stabilization and the prior wardrobe/product-ingestion phase pass completion audits.
## 2026-05-11T16:41 - Avatar Local-Newer Reload Preference

Current status:
- Avatar measurement reload now prefers the local profile when it is newer than the Supabase row.
- Focused verification still passes with 31 tests, TypeScript, Python compileall, Expo bundle smoke, and app-side service-role scan.
- Live backend schema/db health still fails until `ai/supabase/stabilization_patch.sql` is applied.

Completion audit:
- The stabilization objective is not complete because live Supabase persistence and physical-device proof are still missing.
- There is no DDL-capable database URL, Supabase CLI link, or interactive SQL editor access in this shell, so the patch cannot be applied here.

Active blocker:
- Apply `ai/supabase/stabilization_patch.sql`, then run backend schema/db health and the physical-phone persistence/avatar/result-image proof.
- Product-ingestion and advanced fit/recommendation phases remain queued until stabilization and the prior wardrobe/product-ingestion phase pass completion audits.
## 2026-05-11T16:44 - Person And Wardrobe Delete Failure Consistency

Current status:
- Person image and wardrobe deletes now persist local deletion only after Supabase delete succeeds.
- Failed person/wardrobe deletes restore the item locally and report that Supabase was not updated.
- Focused verification now passes with 32 tests, TypeScript, Python compileall, Expo bundle smoke, and app-side service-role scan.
- Live backend schema/db health still fails until `ai/supabase/stabilization_patch.sql` is applied.

Completion audit:
- The stabilization objective is not complete because live Supabase persistence and physical-device proof are still missing.
- There is no DDL-capable database URL, Supabase CLI link, or interactive SQL editor access in this shell, so the patch cannot be applied here.

Active blocker:
- Apply `ai/supabase/stabilization_patch.sql`, then run backend schema/db health and the physical-phone persistence/avatar/result-image proof.
- Product-ingestion and advanced fit/recommendation phases remain queued until stabilization and the prior wardrobe/product-ingestion phase pass completion audits.
## 2026-05-11T15:07 - Try-On Upload Metadata Guard

Current status:
- Try-on render upload metadata now allow-lists image extensions and falls back to `jpg` for extensionless or non-image picker URIs.
- This aligns render `FormData` filenames/content types with the hardened Supabase asset upload path.
- Focused static coverage now guards this behavior.

Verified:
- `npm run typecheck` passed in `fitshelf-app/`.
- `py -m pytest tests/test_fitshelf_backend.py tests/test_fitshelf_tryon.py tests/test_fitshelf_app_static.py` passed with 28 tests.
- `py -m compileall ai/backend ai/fitshelf_tryon ai/scripts` passed.
- Temporary backend on port 8062 returned `/health` ok; schema/db health still fail with the known missing live Supabase columns and patch file.
- Temporary Expo bundle on port 8142 returned HTTP 200 with a 22,097,630-byte bundle.
- `rg "SUPABASE_SERVICE_ROLE_KEY|SERVICE_ROLE" fitshelf-app -n` returned no matches.

Active blocker:
- Apply `ai/supabase/stabilization_patch.sql` in Supabase SQL editor, then run phone proof.
## 2026-05-11T15:11 - Native GLB Asset Loader Path

Current status:
- Avatar GLB loading now passes the bundled `default-mannequin.glb` module directly into `useGLTF`.
- The app still pre-downloads the asset for readiness/status, but no longer feeds the downloaded `file://` URI into the GLTF loader.
- This keeps React Three Fiber native on its Expo asset-module FileLoader path and should reduce device-only fallback to the procedural avatar.
- Static coverage now guards against regressing back to `useGLTF(modelUri)`.

Verified:
- `npm run typecheck` passed in `fitshelf-app/`.
- `py -m pytest tests/test_fitshelf_backend.py tests/test_fitshelf_tryon.py tests/test_fitshelf_app_static.py` passed with 28 tests.
- `py -m compileall ai/backend ai/fitshelf_tryon ai/scripts` passed.
- Temporary backend on port 8063 returned `/health` ok; schema/db health still fail with the known missing live Supabase columns and patch file.
- Temporary Expo bundle on port 8143 returned HTTP 200 with a 22,097,621-byte bundle.
- `rg "SUPABASE_SERVICE_ROLE_KEY|SERVICE_ROLE" fitshelf-app -n` returned no matches.

Completion audit:
- Persistence is not complete until `person_images`, `wardrobe_items`, `saved_looks`, `avatar_profiles`, and `tryon_jobs` are verified through the real signed-in app after the Supabase patch.
- Result image reliability is locally implemented but still needs a phone proof pass.
- Avatar GLB loading is improved locally but still needs a phone proof pass showing status `GLB`, not `Fallback`.
- Auth redirect manual recovery is implemented, but automatic email redirect behavior still depends on Supabase redirect allow-listing.

Active blocker:
- Apply `ai/supabase/stabilization_patch.sql`, then rerun backend schema/db health and physical-device verification before starting product URL ingestion or wardrobe workflow expansion.
## 2026-05-11T15:14 - Avatar Measurement Controls Layout

Current status:
- Avatar measurement controls now render in a wrapping two-column grid when space allows, instead of a long single column.
- Each measurement still has a slider and numeric input.
- Static coverage now guards the wrapping grid layout.

Verified:
- `npm run typecheck` passed in `fitshelf-app/`.
- `py -m pytest tests/test_fitshelf_backend.py tests/test_fitshelf_tryon.py tests/test_fitshelf_app_static.py` passed with 28 tests.
- `py -m compileall ai/backend ai/fitshelf_tryon ai/scripts` passed.
- Temporary backend on port 8064 returned `/health` ok; schema/db health still fail with the known missing live Supabase columns and patch file.
- Temporary Expo bundle on port 8144 returned HTTP 200 with a 22,097,736-byte bundle.
- `rg "SUPABASE_SERVICE_ROLE_KEY|SERVICE_ROLE" fitshelf-app -n` returned no matches.

Active blocker:
- Apply `ai/supabase/stabilization_patch.sql`, then rerun backend schema/db health and physical-device verification.
## 2026-05-11T15:18 - Product Import Hidden During Stabilization

Current status:
- Product URL import UI and app wiring are no longer exposed in the Closet screen during this stabilization run.
- Closet remains focused on the core `Add person` and `Add garment` persistence flows.
- Static coverage now guards that product URL import is not reachable before stabilization proof passes.

Verified:
- `npm run typecheck` passed in `fitshelf-app/`.
- `py -m pytest tests/test_fitshelf_backend.py tests/test_fitshelf_tryon.py tests/test_fitshelf_app_static.py` passed with 29 tests.
- `py -m compileall ai/backend ai/fitshelf_tryon ai/scripts` passed.
- Temporary backend on port 8065 returned `/health` ok; schema/db health still fail with the known missing live Supabase columns and patch file.
- Temporary Expo bundle on port 8145 returned HTTP 200 with a 22,091,886-byte bundle.
- `rg "SUPABASE_SERVICE_ROLE_KEY|SERVICE_ROLE" fitshelf-app -n` returned no matches.

Completion audit:
- Product URL ingestion remains explicitly deferred until stabilization proof passes.
- Core persistence still cannot be marked complete because live Supabase schema/db health fails before phone persistence proof.

Active blocker:
- Apply `ai/supabase/stabilization_patch.sql`, then rerun backend schema/db health and physical-device verification.
## 2026-05-11T15:22 - Avatar Fallback Diagnostic

Current status:
- Avatar GLB fallback now shows a short sanitized error message in the viewer banner.
- Asset download failures and GLB render/load boundary failures both populate the fallback detail.
- Successful GLB load clears the diagnostic message.
- Static coverage now guards the visible fallback diagnostic path.

Verified:
- `npm run typecheck` passed in `fitshelf-app/`.
- `py -m pytest tests/test_fitshelf_backend.py tests/test_fitshelf_tryon.py tests/test_fitshelf_app_static.py` passed with 29 tests.
- `py -m compileall ai/backend ai/fitshelf_tryon ai/scripts` passed.
- Temporary backend on port 8066 returned `/health` ok; schema/db health still fail with the known missing live Supabase columns and patch file.
- Temporary Expo bundle on port 8146 returned HTTP 200 with a 22,092,877-byte bundle.
- `rg "SUPABASE_SERVICE_ROLE_KEY|SERVICE_ROLE" fitshelf-app -n` returned no matches.

Completion audit:
- Avatar GLB remains locally improved but requires phone proof. If the phone still falls back, the banner should now provide the failure string needed for the next fix.
- Core persistence still cannot be marked complete because live Supabase schema/db health fails before phone persistence proof.

Active blocker:
- Apply `ai/supabase/stabilization_patch.sql`, then rerun backend schema/db health and physical-device verification.
## 2026-05-11T15:25 - Avatar Finite Bounds Guard

Current status:
- GLB autoscale now validates finite scene bounds before centering and scaling the loaded model.
- Empty, non-finite, or non-positive GLB dimensions now throw a clear fallback error instead of applying a bad scale.
- Static coverage now guards the finite-bounds and scale-computation checks.

Verified:
- `npm run typecheck` passed in `fitshelf-app/`.
- `py -m pytest tests/test_fitshelf_backend.py tests/test_fitshelf_tryon.py tests/test_fitshelf_app_static.py` passed with 29 tests.
- `py -m compileall ai/backend ai/fitshelf_tryon ai/scripts` passed.
- Temporary backend on port 8067 returned `/health` ok; schema/db health still fail with the known missing live Supabase columns and patch file.
- Temporary Expo bundle on port 8147 returned HTTP 200 with a 22,093,499-byte bundle.
- `rg "SUPABASE_SERVICE_ROLE_KEY|SERVICE_ROLE" fitshelf-app -n` returned no matches.

Completion audit:
- Avatar NaN/invalid-bounds handling is locally improved, but GLB render still requires phone proof.
- Core persistence still cannot be marked complete because live Supabase schema/db health fails before phone persistence proof.

Active blocker:
- Apply `ai/supabase/stabilization_patch.sql`, then rerun backend schema/db health and physical-device verification.
## 2026-05-11T15:29 - Explicit Supabase Save Failure Wording

Current status:
- Save Person and Save Garment cloud-write failure messages now explicitly say the item was not saved to Supabase and that a local copy was kept.
- The older vague `local fallback active` wording is removed from the app.
- Static coverage now guards the explicit failure wording.

Verified:
- `npm run typecheck` passed in `fitshelf-app/`.
- `py -m pytest tests/test_fitshelf_backend.py tests/test_fitshelf_tryon.py tests/test_fitshelf_app_static.py` passed with 29 tests.
- `py -m compileall ai/backend ai/fitshelf_tryon ai/scripts` passed.
- Temporary backend on port 8068 returned `/health` ok; schema/db health still fail with the known missing live Supabase columns and patch file.
- Temporary Expo bundle on port 8148 returned HTTP 200 with a 22,093,583-byte bundle.
- `rg "SUPABASE_SERVICE_ROLE_KEY|SERVICE_ROLE" fitshelf-app -n` returned no matches.

Completion audit:
- App-side failure visibility is improved, but persistence still cannot be marked complete because live Supabase schema/db health fails before phone persistence proof.

Active blocker:
- Apply `ai/supabase/stabilization_patch.sql`, then rerun backend schema/db health and physical-device verification.
## 2026-05-11T15:32 - Explicit Save Look Failure Wording

Current status:
- Save Look cloud-write failure messages now explicitly say the look was not saved to Supabase and that a local copy was kept.
- Static coverage now guards the explicit Save Look failure wording.

Verified:
- `npm run typecheck` passed in `fitshelf-app/`.
- `py -m pytest tests/test_fitshelf_backend.py tests/test_fitshelf_tryon.py tests/test_fitshelf_app_static.py` passed with 29 tests.
- `py -m compileall ai/backend ai/fitshelf_tryon ai/scripts` passed.
- Temporary backend on port 8069 returned `/health` ok; schema/db health still fail with the known missing live Supabase columns and patch file.
- Temporary Expo bundle on port 8149 returned HTTP 200 with a 22,093,607-byte bundle.
- `rg "SUPABASE_SERVICE_ROLE_KEY|SERVICE_ROLE" fitshelf-app -n` returned no matches.

Completion audit:
- App-side Saved Look failure visibility is improved, but persistence still cannot be marked complete because live Supabase schema/db health fails before phone persistence proof.

Active blocker:
- Apply `ai/supabase/stabilization_patch.sql`, then rerun backend schema/db health and physical-device verification.
## 2026-05-11T15:35 - Storage Path Public URL Reload Fallback

Current status:
- Person image and wardrobe reloads now derive a public Supabase Storage URL from `storage_path` when `image_url` is absent.
- This prevents reloads from handing React Native a raw bucket path for older or partially populated rows.
- Static coverage now guards the `publicAssetUrl(...)` reload fallback.

Verified:
- `npm run typecheck` passed in `fitshelf-app/`.
- `py -m pytest tests/test_fitshelf_backend.py tests/test_fitshelf_tryon.py tests/test_fitshelf_app_static.py` passed with 30 tests.
- `py -m compileall ai/backend ai/fitshelf_tryon ai/scripts` passed.
- Temporary backend on port 8070 returned `/health` ok; schema/db health still fail with the known missing live Supabase columns and patch file.
- Temporary Expo bundle on port 8150 returned HTTP 200 with a 22,094,028-byte bundle.
- `rg "SUPABASE_SERVICE_ROLE_KEY|SERVICE_ROLE" fitshelf-app -n` returned no matches.

Completion audit:
- Reload display resilience is improved, but persistence still cannot be marked complete because live Supabase schema/db health fails before phone persistence proof.
- Operator requested advanced fit/recommendation/production phases after wardrobe/product-ingestion is stable; those phases remain queued and must not start until stabilization and the wardrobe/product-ingestion phase pass their completion audits.

Active blocker:
- Apply `ai/supabase/stabilization_patch.sql`, then rerun backend schema/db health and physical-device verification.
## 2026-05-11T15:40 - Saved Look Thumbnail Proxy Fallback

Current status:
- Saved Looks gallery thumbnails now use the backend object proxy when a durable `resultStoragePath` exists and no local result URL is available.
- This avoids relying on possibly expired signed `resultUrl` values for gallery thumbnails.
- Static coverage now guards the thumbnail fallback.

Verified:
- `npm run typecheck` passed in `fitshelf-app/`.
- `py -m pytest tests/test_fitshelf_backend.py tests/test_fitshelf_tryon.py tests/test_fitshelf_app_static.py` passed with 30 tests.
- `py -m compileall ai/backend ai/fitshelf_tryon ai/scripts` passed.
- Temporary backend on port 8071 returned `/health` ok; schema/db health still fail with the known missing live Supabase columns and patch file.
- Temporary Expo bundle on port 8151 returned HTTP 200 with a 22,094,248-byte bundle.
- `rg "SUPABASE_SERVICE_ROLE_KEY|SERVICE_ROLE" fitshelf-app -n` returned no matches.

Completion audit:
- Saved Look gallery image resilience is improved, but persistence still cannot be marked complete because live Supabase schema/db health fails before phone persistence proof.
- Advanced product phases remain queued behind stabilization and wardrobe/product-ingestion completion.

Active blocker:
- Apply `ai/supabase/stabilization_patch.sql`, then rerun backend schema/db health and physical-device verification.
## 2026-05-11T14:00 - Supabase Patch Contract Static Test

Current status:
- Added static regression coverage for `ai/supabase/stabilization_patch.sql`.
- The test protects required stabilization columns, required Supabase buckets, storage policy/auth path restriction, and PostgREST schema cache reload.
- Live Supabase remains blocked until the patch is applied manually.

Verified:
- `npm run typecheck` passed.
- `py -m pytest tests/test_fitshelf_backend.py tests/test_fitshelf_tryon.py tests/test_fitshelf_app_static.py` passed with 16 tests.
- `py -m compileall ai/backend ai/fitshelf_tryon ai/scripts` passed.
- Temporary backend on port 8044 returned:
  - `/supabase/schema-health`: `ok=false`, `patch_file=ai/supabase/stabilization_patch.sql`.
  - `/supabase/db-health`: `priority_tables_ok=false`, `patch_file=ai/supabase/stabilization_patch.sql`, error on missing `person_images.image_url`.
- Temporary Expo bundle on port 8124 returned HTTP 200 with 22,089,490 bytes.
- `rg "SUPABASE_SERVICE_ROLE_KEY|SERVICE_ROLE" fitshelf-app -n` returned no matches.

Active blocker:
- Apply `ai/supabase/stabilization_patch.sql` in Supabase SQL editor, then confirm `Test Backend Schema` and `Test Backend DB` pass.
## 2026-05-11T14:04 - User-Scoped Supabase Reloads

Current status:
- Supabase reload queries for `person_images`, `wardrobe_items`, and `saved_looks` now explicitly filter by the authenticated `user_id`.
- Added a static regression test so restart/reload reads remain user-scoped instead of relying only on RLS filtering.
- Focused test count is now 17 passing tests.

Completion audit:
- Persistence code paths and UI affordances are present, but live persistence is not complete until the SQL patch is applied and phone rows are verified.
- Result image fallback code paths are present, but physical-device image recovery still needs proof.
- Avatar GLB path and controls are present, but physical-device GLB rendering still needs proof.
- Auth redirect/session recovery code paths are present, but automatic email redirect still needs phone verification.
- CatV2TON remains out of scope for this stabilization pass.

Verified:
- `npm run typecheck` passed.
- `py -m pytest tests/test_fitshelf_backend.py tests/test_fitshelf_tryon.py tests/test_fitshelf_app_static.py` passed with 17 tests.
- `py -m compileall ai/backend ai/fitshelf_tryon ai/scripts` passed.
- Temporary backend on port 8045 returned health `ok`, schema health `ok=false`, `patch_file=ai/supabase/stabilization_patch.sql`, and the known missing column list.
- Temporary backend DB health on port 8045 returned `priority_tables_ok=false`, `patch_file=ai/supabase/stabilization_patch.sql`, and the known `person_images.image_url` schema-cache error.
- Temporary Expo bundle on port 8125 returned HTTP 200 with 22,089,572 bytes.
- `rg "SUPABASE_SERVICE_ROLE_KEY|SERVICE_ROLE" fitshelf-app -n` returned no matches.

Active blocker:
- Apply `ai/supabase/stabilization_patch.sql` in Supabase SQL editor, then run the phone checklist.
## 2026-05-11T14:09 - Manual Auth Callback Recovery

Current status:
- Added a manual auth callback recovery path to `AuthPanel`.
- If an email verification link opens in the phone browser instead of returning to Expo, the operator can paste the full callback URL and tap `Restore callback`.
- The static app contract now verifies the visible callback recovery UI and `handleSupabaseAuthCallback(url)` wiring.
- `fitshelf-app/README.md` and `ai/supabase/README.md` document the manual recovery path.

Completion audit:
- Persistence code paths and UI affordances are present, but live persistence is still blocked by the unapplied SQL patch.
- Result image fallback, GLB avatar path, touch gestures, numeric avatar inputs, and auth/session recovery paths are present in code, but physical-device proof is still required.
- CatV2TON remains intentionally deprioritized.

Verified:
- `npm run typecheck` passed.
- `py -m pytest tests/test_fitshelf_backend.py tests/test_fitshelf_tryon.py tests/test_fitshelf_app_static.py` passed with 17 tests.
- `py -m compileall ai/backend ai/fitshelf_tryon ai/scripts` passed.
- Temporary backend on port 8046 returned health `ok`, schema health `ok=false`, and DB health `priority_tables_ok=false`, both pointing to `ai/supabase/stabilization_patch.sql`.
- Temporary Expo bundle on port 8126 returned HTTP 200 with 22,093,205 bytes.
- `rg "SUPABASE_SERVICE_ROLE_KEY|SERVICE_ROLE" fitshelf-app -n` returned no matches.

Active blocker:
- Apply `ai/supabase/stabilization_patch.sql`, then perform physical phone verification.
## 2026-05-11T14:13 - User-Scoped DB Debug Probe

Current status:
- App-side `Test DB Write` now scopes transient cleanup, read checks, and delete checks by authenticated `user_id` for `person_images`, `wardrobe_items`, `tryon_jobs`, and `saved_looks`.
- Added static coverage for the user-scoped DB probe filters.
- Focused test count is now 18 passing tests.

Completion audit:
- The visible debug action now better proves that rows belong to the signed-in user, not merely that a known id exists.
- Live persistence is still not complete because the Supabase patch has not been applied and rows have not been proven on the physical phone.

Verified:
- `npm run typecheck` passed.
- `py -m pytest tests/test_fitshelf_backend.py tests/test_fitshelf_tryon.py tests/test_fitshelf_app_static.py` passed with 18 tests.
- `py -m compileall ai/backend ai/fitshelf_tryon ai/scripts` passed.
- Temporary backend on port 8047 returned health `ok`, schema health `ok=false`, and DB health `priority_tables_ok=false`, both pointing to `ai/supabase/stabilization_patch.sql`.
- Temporary Expo bundle on port 8127 returned HTTP 200 with 22,093,565 bytes.
- `rg "SUPABASE_SERVICE_ROLE_KEY|SERVICE_ROLE" fitshelf-app -n` returned no matches.

Active blocker:
- Apply `ai/supabase/stabilization_patch.sql`, then run the physical phone persistence and avatar/result-image checks.
## 2026-05-11T14:17 - Backend DB Health User Scope

Current status:
- Backend `/supabase/db-health` now scopes priority-table read/delete/cleanup probes by the synthetic test `user_id`.
- Added a backend regression test for the user-scoped DB-health query contract.
- Focused test count is now 19 passing tests.

Completion audit:
- Both app-side `Test DB Write` and backend `Test Backend DB` now verify priority rows through user-scoped probes.
- Live persistence is still blocked until the Supabase stabilization SQL is applied and the phone proves rows/reloads.

Verified:
- `npm run typecheck` passed.
- `py -m pytest tests/test_fitshelf_backend.py tests/test_fitshelf_tryon.py tests/test_fitshelf_app_static.py` passed with 19 tests.
- `py -m compileall ai/backend ai/fitshelf_tryon ai/scripts` passed.
- Temporary backend on port 8048 returned health `ok`, schema health `ok=false`, and DB health `priority_tables_ok=false`, both pointing to `ai/supabase/stabilization_patch.sql`.
- Temporary Expo bundle on port 8128 returned HTTP 200 with 22,093,565 bytes.
- `rg "SUPABASE_SERVICE_ROLE_KEY|SERVICE_ROLE" fitshelf-app -n` returned no matches.

Active blocker:
- Apply `ai/supabase/stabilization_patch.sql`, then rerun phone/backend gates and physical-device persistence checks.
## 2026-05-11T14:20 - GLB Asset Contract Guard

Current status:
- Added static coverage that verifies `fitshelf-app/assets/avatar/default-mannequin.glb` is a real binary GLB asset.
- Focused test count is now 20 passing tests.

Completion audit:
- Avatar code uses a GLB path and the bundled asset is now covered as a real GLB, but physical-device rendering still needs proof because Expo/R3F device behavior cannot be proven by static tests alone.
- Live persistence remains blocked by the unapplied Supabase SQL patch.

Verified:
- `npm run typecheck` passed.
- `py -m pytest tests/test_fitshelf_backend.py tests/test_fitshelf_tryon.py tests/test_fitshelf_app_static.py` passed with 20 tests.
- `py -m compileall ai/backend ai/fitshelf_tryon ai/scripts` passed.
- Temporary backend on port 8049 returned health `ok`, schema health `ok=false`, and DB health `priority_tables_ok=false`, both pointing to `ai/supabase/stabilization_patch.sql`.
- Temporary Expo bundle on port 8129 returned HTTP 200 with 22,093,565 bytes.
- `rg "SUPABASE_SERVICE_ROLE_KEY|SERVICE_ROLE" fitshelf-app -n` returned no matches.

Active blocker:
- Apply `ai/supabase/stabilization_patch.sql`, then verify persistence and GLB behavior on the physical phone.
## 2026-05-11T14:23 - GLB Finite Geometry Guard

Current status:
- Extended the bundled avatar asset test to parse the GLB JSON chunk and verify mesh position accessors have finite bounds.
- Focused test count remains 20 passing tests.

Completion audit:
- The NaN-geometry requirement is now guarded at the asset metadata level.
- Physical-device GLB rendering is still not proven by static checks.
- Live persistence remains blocked by the unapplied Supabase SQL patch.

Verified:
- `npm run typecheck` passed.
- `py -m pytest tests/test_fitshelf_backend.py tests/test_fitshelf_tryon.py tests/test_fitshelf_app_static.py` passed with 20 tests.
- `py -m compileall ai/backend ai/fitshelf_tryon ai/scripts` passed.
- Temporary backend on port 8050 returned health `ok`, schema health `ok=false`, and DB health `priority_tables_ok=false`, both pointing to `ai/supabase/stabilization_patch.sql`.
- Temporary Expo bundle on port 8130 returned HTTP 200 with 22,093,565 bytes.
- `rg "SUPABASE_SERVICE_ROLE_KEY|SERVICE_ROLE" fitshelf-app -n` returned no matches.

Active blocker:
- Apply `ai/supabase/stabilization_patch.sql`, then verify persistence and GLB behavior on the physical phone.
## 2026-05-11T14:27 - Expo GLB Runtime Config Guard

Current status:
- Added static coverage for Expo/R3F GLB runtime prerequisites: R3F/Drei/Three/Expo GL/Expo Asset dependencies, Metro GLB/GLTF asset extensions, mjs source extension, and expo-asset plugin.
- Focused test count is now 21 passing tests.

Completion audit:
- The repo now guards the bundled GLB file and the Expo config needed to package/load it.
- Physical-device GLB rendering still needs proof because runtime loader/device behavior cannot be proven by static checks.
- Live persistence remains blocked by the unapplied Supabase SQL patch.

Verified:
- `npm run typecheck` passed.
- `py -m pytest tests/test_fitshelf_backend.py tests/test_fitshelf_tryon.py tests/test_fitshelf_app_static.py` passed with 21 tests.
- `py -m compileall ai/backend ai/fitshelf_tryon ai/scripts` passed.
- Temporary backend on port 8051 returned health `ok`, schema health `ok=false`, and DB health `priority_tables_ok=false`, both pointing to `ai/supabase/stabilization_patch.sql`.
- Temporary Expo bundle on port 8131 returned HTTP 200 with 22,093,565 bytes.
- `rg "SUPABASE_SERVICE_ROLE_KEY|SERVICE_ROLE" fitshelf-app -n` returned no matches.

Active blocker:
- Apply `ai/supabase/stabilization_patch.sql`, then verify persistence and GLB behavior on the physical phone.
## 2026-05-11T14:30 - Production Save User ID Contract

Current status:
- Added static coverage that verifies production Supabase save paths include `user_id` payloads for `person_images`, `wardrobe_items`, `saved_looks`, `tryon_jobs`, and `avatar_profiles`.
- Focused test count is now 22 passing tests.

Completion audit:
- The production save contract is now explicitly guarded for the priority persistence tables.
- Live row creation is still not proven because the Supabase patch has not been applied.

Verified:
- `npm run typecheck` passed.
- `py -m pytest tests/test_fitshelf_backend.py tests/test_fitshelf_tryon.py tests/test_fitshelf_app_static.py` passed with 22 tests.
- `py -m compileall ai/backend ai/fitshelf_tryon ai/scripts` passed.
- Temporary backend on port 8052 returned health `ok`, schema health `ok=false`, and DB health `priority_tables_ok=false`, both pointing to `ai/supabase/stabilization_patch.sql`.
- Temporary Expo bundle on port 8132 returned HTTP 200 with 22,093,565 bytes.
- `rg "SUPABASE_SERVICE_ROLE_KEY|SERVICE_ROLE" fitshelf-app -n` returned no matches.

Active blocker:
- Apply `ai/supabase/stabilization_patch.sql`, then verify persistence rows on the physical phone.
## 2026-05-11T14:33 - Saved Look Durable Field Contract

Current status:
- Added static coverage that verifies `saveSavedLooks` writes `tryon_job_id`, `result_storage_path`, `local_result_url`, and `result_url`.
- Focused test count is now 23 passing tests.

Completion audit:
- Saved-look Supabase persistence now has explicit coverage for the durable result-image recovery fields.
- Live saved-look rows and reload behavior still need proof after the Supabase patch is applied.

Verified:
- `npm run typecheck` passed.
- `py -m pytest tests/test_fitshelf_backend.py tests/test_fitshelf_tryon.py tests/test_fitshelf_app_static.py` passed with 23 tests.
- `py -m compileall ai/backend ai/fitshelf_tryon ai/scripts` passed.
- Temporary backend on port 8053 returned health `ok`, schema health `ok=false`, and DB health `priority_tables_ok=false`, both pointing to `ai/supabase/stabilization_patch.sql`.
- Temporary Expo bundle on port 8133 returned HTTP 200 with 22,093,565 bytes.
- `rg "SUPABASE_SERVICE_ROLE_KEY|SERVICE_ROLE" fitshelf-app -n` returned no matches.

Active blocker:
- Apply `ai/supabase/stabilization_patch.sql`, then verify saved-look rows and image reload/fallback on the physical phone.
## 2026-05-11T14:37 - Manual Drafts Versus Saved Looks Guard

Current status:
- Added static coverage that keeps the old outfit builder labeled as local-only `Manual Drafts`.
- The test verifies the app uses `manual` instead of an `outfits` tab, shows the local-only notice, and keeps Try-On `Saved Looks` as the generated-results surface.
- Focused test count is now 24 passing tests.

Completion audit:
- The stale outfits screen is guarded against being confused with Supabase-backed generated results.
- Live saved-look persistence and reload still require phone proof after the Supabase patch.

Verified:
- `npm run typecheck` passed.
- `py -m pytest tests/test_fitshelf_backend.py tests/test_fitshelf_tryon.py tests/test_fitshelf_app_static.py` passed with 24 tests.
- `py -m compileall ai/backend ai/fitshelf_tryon ai/scripts` passed.
- Temporary backend on port 8054 returned health `ok`, schema health `ok=false`, and DB health `priority_tables_ok=false`, both pointing to `ai/supabase/stabilization_patch.sql`.
- Temporary Expo bundle on port 8134 returned HTTP 200 with 22,093,565 bytes.
- `rg "SUPABASE_SERVICE_ROLE_KEY|SERVICE_ROLE" fitshelf-app -n` returned no matches.

Active blocker:
- Apply `ai/supabase/stabilization_patch.sql`, then verify Saved Looks persistence/reload on the physical phone.
## 2026-05-11T14:40 - Supabase Success Message Guard

Current status:
- Added static coverage that verifies Save Person and Save Garment only use the `saved to Supabase` success message in the `uploaded.storagePath` branch.
- Focused test count is now 25 passing tests.

Completion audit:
- The phone-facing save messages are now guarded so local fallback cannot be mislabeled as Supabase persistence.
- Live persistence still requires the Supabase patch and physical-device proof.

Verified:
- `npm run typecheck` passed.
- `py -m pytest tests/test_fitshelf_backend.py tests/test_fitshelf_tryon.py tests/test_fitshelf_app_static.py` passed with 25 tests.
- `py -m compileall ai/backend ai/fitshelf_tryon ai/scripts` passed.
- Temporary backend on port 8055 returned health `ok`, schema health `ok=false`, and DB health `priority_tables_ok=false`, both pointing to `ai/supabase/stabilization_patch.sql`.
- Temporary Expo bundle on port 8135 returned HTTP 200 with 22,093,565 bytes.
- `rg "SUPABASE_SERVICE_ROLE_KEY|SERVICE_ROLE" fitshelf-app -n` returned no matches.

Active blocker:
- Apply `ai/supabase/stabilization_patch.sql`, then verify Save Person/Garment rows on the physical phone.
## 2026-05-11T14:44 - Signed URL Proxy Response Guard

Current status:
- Added backend test coverage that `/supabase/sign` returns `supabase_proxy_url` alongside the signed result URL.
- This protects the backend proxy fallback used when a phone cannot render a Supabase signed URL directly.

Completion audit:
- Result-image proxy fallback is guarded at the backend response level.
- Physical-device image fallback still needs proof.
- Live persistence remains blocked by the unapplied Supabase SQL patch.

Verified:
- `npm run typecheck` passed.
- `py -m pytest tests/test_fitshelf_backend.py tests/test_fitshelf_tryon.py tests/test_fitshelf_app_static.py` passed with 25 tests.
- `py -m compileall ai/backend ai/fitshelf_tryon ai/scripts` passed.
- Temporary backend on port 8056 returned health `ok`, schema health `ok=false`, and DB health `priority_tables_ok=false`, both pointing to `ai/supabase/stabilization_patch.sql`.
- Temporary Expo bundle on port 8136 returned HTTP 200 with 22,093,565 bytes.
- `rg "SUPABASE_SERVICE_ROLE_KEY|SERVICE_ROLE" fitshelf-app -n` returned no matches.

Active blocker:
- Apply `ai/supabase/stabilization_patch.sql`, then verify saved-look image refresh and proxy fallback on the physical phone.
## 2026-05-11T14:48 - Proxy Storage Path Encoding

Current status:
- Backend `/supabase/sign` now percent-encodes the storage path in `supabase_proxy_url`.
- Added a regression test for proxy URLs containing spaces and slash-separated storage paths.
- Focused test count is now 26 passing tests.

Completion audit:
- Backend proxy fallback URLs are safer for React Native image loading.
- Physical-device image fallback still needs proof.
- Live persistence remains blocked by the unapplied Supabase SQL patch.

Verified:
- `npm run typecheck` passed.
- `py -m pytest tests/test_fitshelf_backend.py tests/test_fitshelf_tryon.py tests/test_fitshelf_app_static.py` passed with 26 tests.
- `py -m compileall ai/backend ai/fitshelf_tryon ai/scripts` passed.
- Temporary backend on port 8057 returned health `ok`, schema health `ok=false`, and DB health `priority_tables_ok=false`, both pointing to `ai/supabase/stabilization_patch.sql`.
- Temporary Expo bundle on port 8137 returned HTTP 200 with 22,093,565 bytes.
- `rg "SUPABASE_SERVICE_ROLE_KEY|SERVICE_ROLE" fitshelf-app -n` returned no matches.

Active blocker:
- Apply `ai/supabase/stabilization_patch.sql`, then verify saved-look image refresh and proxy fallback on the physical phone.
## 2026-05-11T14:52 - Storage Error Patch Hint

Current status:
- App storage-layer Supabase errors now append the exact `ai/supabase/stabilization_patch.sql` instruction for schema-cache/missing-column failures.
- Static coverage verifies both storage and debug Supabase helpers expose the patch hint.

Completion audit:
- Save Person/Garment/Saved Look failures now surface the same repair path as the debug gates.
- Live persistence remains blocked by the unapplied Supabase SQL patch.

Verified:
- `npm run typecheck` passed.
- `py -m pytest tests/test_fitshelf_backend.py tests/test_fitshelf_tryon.py tests/test_fitshelf_app_static.py` passed with 26 tests.
- `py -m compileall ai/backend ai/fitshelf_tryon ai/scripts` passed.
- Temporary backend on port 8058 returned health `ok`, schema health `ok=false`, and DB health `priority_tables_ok=false`, both pointing to `ai/supabase/stabilization_patch.sql`.
- Temporary Expo bundle on port 8138 returned HTTP 200 with 22,093,949 bytes.
- `rg "SUPABASE_SERVICE_ROLE_KEY|SERVICE_ROLE" fitshelf-app -n` returned no matches.

Active blocker:
- Apply `ai/supabase/stabilization_patch.sql`, then verify phone persistence and reloads.
## 2026-05-11T14:56 - React Native Storage Upload Uses ArrayBuffer

Current status:
- `uploadAsset` now uses Expo FileSystem base64 reads for local photo URIs and uploads an `ArrayBuffer` to Supabase Storage.
- Remote product image URLs still use `fetch(...).arrayBuffer()`.
- Added static coverage that the upload path avoids `.blob()` and uses the React Native-compatible ArrayBuffer path.
- Focused test count is now 27 passing tests.

Completion audit:
- This directly addresses a likely phone failure mode for person/garment storage upload persistence.
- Live row/storage proof still requires the Supabase patch and phone test.

Verified:
- `npm run typecheck` passed.
- `py -m pytest tests/test_fitshelf_backend.py tests/test_fitshelf_tryon.py tests/test_fitshelf_app_static.py` passed with 27 tests.
- `py -m compileall ai/backend ai/fitshelf_tryon ai/scripts` passed.
- Temporary backend on port 8059 returned health `ok`, schema health `ok=false`, and DB health `priority_tables_ok=false`, both pointing to `ai/supabase/stabilization_patch.sql`.
- Temporary Expo bundle on port 8139 returned HTTP 200 with 22,096,270 bytes.
- `rg "SUPABASE_SERVICE_ROLE_KEY|SERVICE_ROLE" fitshelf-app -n` returned no matches.

Active blocker:
- Apply `ai/supabase/stabilization_patch.sql`, then verify Save Person/Garment storage uploads and rows on the physical phone.
## 2026-05-11T14:59 - Debug Asset Upload Uses ArrayBuffer

Current status:
- `Test Asset Upload` now uses an ArrayBuffer body instead of `Blob`.
- The debug storage check now matches the React Native-compatible upload path used by Save Person/Garment.
- Focused test count remains 27 passing tests.

Completion audit:
- The phone-facing storage debug action should no longer fail merely because React Native Blob upload is unreliable.
- Live storage and row proof still require the Supabase patch and phone test.

Verified:
- `npm run typecheck` passed.
- `py -m pytest tests/test_fitshelf_backend.py tests/test_fitshelf_tryon.py tests/test_fitshelf_app_static.py` passed with 27 tests.
- `py -m compileall ai/backend ai/fitshelf_tryon ai/scripts` passed.
- Temporary backend on port 8060 returned health `ok`, schema health `ok=false`, and DB health `priority_tables_ok=false`, both pointing to `ai/supabase/stabilization_patch.sql`.
- Temporary Expo bundle on port 8140 returned HTTP 200 with 22,096,471 bytes.
- `rg "SUPABASE_SERVICE_ROLE_KEY|SERVICE_ROLE" fitshelf-app -n` returned no matches.

Active blocker:
- Apply `ai/supabase/stabilization_patch.sql`, then verify `Test Asset Upload` and Save Person/Garment on the physical phone.
## 2026-05-11T15:03 - Upload Extension Allowlist

Current status:
- `uploadAsset` now allow-lists image extensions (`jpg`, `jpeg`, `png`, `webp`) and falls back to `jpg` for extensionless picker URIs.
- Static coverage verifies the extension allowlist and fallback.
- Focused test count remains 27 passing tests.

Completion audit:
- This avoids invalid Supabase object paths from `content://` or other extensionless phone picker URIs.
- Stabilization is still not complete because live Supabase patch application and physical phone proof remain missing.
- The next product workflow phase is queued by the operator, but must wait until stabilization is actually complete.

Verified:
- `npm run typecheck` passed.
- `py -m pytest tests/test_fitshelf_backend.py tests/test_fitshelf_tryon.py tests/test_fitshelf_app_static.py` passed with 27 tests.
- `py -m compileall ai/backend ai/fitshelf_tryon ai/scripts` passed.
- Temporary backend on port 8061 returned health `ok`, schema health `ok=false`, and DB health `priority_tables_ok=false`, both pointing to `ai/supabase/stabilization_patch.sql`.
- Temporary Expo bundle on port 8141 returned HTTP 200 with 22,096,916 bytes.
- `rg "SUPABASE_SERVICE_ROLE_KEY|SERVICE_ROLE" fitshelf-app -n` returned no matches.

Active blocker:
- Apply `ai/supabase/stabilization_patch.sql`, then verify storage uploads, rows, reloads, GLB, auth, and image fallback on the physical phone.
## 2026-05-11T13:15 - Latest Checkpoint Pointer

Current status:
- Latest code change is Save Person/Garment status propagation from `App.tsx` to `TryOnPanel`.
- Verification at 13:15 is recorded in `PROOF.md`, `BLOCKERS.md`, `DECISIONS.md`, and `RESUME.md`.
- The active blocker remains the unapplied `ai/supabase/stabilization_patch.sql` and physical-device verification.
## 2026-05-11T13:15 - Latest Checkpoint Pointer

Current status:
- Latest code change is Save Person/Garment status propagation from `App.tsx` to `TryOnPanel`.
- Verification at 13:15 is recorded in `PROOF.md`, `BLOCKERS.md`, `DECISIONS.md`, and `RESUME.md`.
- The active blocker remains the unapplied `ai/supabase/stabilization_patch.sql` and physical-device verification.
## 2026-05-11T13:11 - Save Person And Garment Feedback

Current status:
- Try-On now awaits `Save Person` and `Save Garment` callbacks instead of firing them without local completion feedback.
- Save buttons show `Saving Person` or `Saving Garment` while upload/table sync is running.
- Try-On now reports local completion/failure for Save Person/Garment and still points the operator to the sync panel for Supabase table status.

Verified:
- `npm run typecheck` passed.
- `py -m pytest tests/test_fitshelf_backend.py tests/test_fitshelf_tryon.py` passed with 11 tests.
- `py -m compileall ai/backend ai/fitshelf_tryon ai/scripts` passed.
- Live backend schema health on temporary port 8032 still returned the known missing columns and `patch_file=ai/supabase/stabilization_patch.sql`.
- Expo bundle smoke on temporary port 8112 returned HTTP 200 with a 22,085,035-byte bundle.
- `rg "SUPABASE_SERVICE_ROLE_KEY|SERVICE_ROLE" fitshelf-app -n` returned no matches.
- Temporary ports 8032 and 8112 were not left running.

Active blocker:
- Apply `ai/supabase/stabilization_patch.sql`, then rerun backend schema/db health and phone tests.
## 2026-05-11T13:15 - Save Status Propagates To Try-On

Current status:
- `addMannequin()` and `addClothing()` now return their exact sync status messages to Try-On.
- Try-On displays those returned messages after Save Person/Garment, so the operator can see local fallback, Storage upload failure, or table sync failure in the same panel.
- The header wardrobe summary now uses ASCII separators.

Verified:
- `npm run typecheck` passed.
- `py -m pytest tests/test_fitshelf_backend.py tests/test_fitshelf_tryon.py` passed with 11 tests.
- `py -m compileall ai/backend ai/fitshelf_tryon ai/scripts` passed.
- Live backend schema health on temporary port 8033 still returned the known missing columns and `patch_file=ai/supabase/stabilization_patch.sql`.
- Expo bundle smoke on temporary port 8113 returned HTTP 200 with a 22,085,661-byte bundle.
- `rg "SUPABASE_SERVICE_ROLE_KEY|SERVICE_ROLE" fitshelf-app -n` returned no matches.
- Temporary ports 8033 and 8113 were not left running.

Active blocker:
- Apply `ai/supabase/stabilization_patch.sql`, then rerun backend schema/db health and physical-device verification.
## 2026-05-11T13:53 - App Persistence/Auth/Debug Contract Static Test

Current status:
- Extended `tests/test_fitshelf_app_static.py` with an app-side Supabase persistence/auth/debug contract test.
- The test verifies visible debug buttons, auth callback handling, initial/link-event session recovery hooks, Try-On save callback wiring, priority table references, `user_id` writes, sanitized error throwing, patch hint, and no service-role key text in Expo sources.
- Focused test count is now 15 passing tests.

Verified:
- `npm run typecheck` passed.
- `py -m pytest tests/test_fitshelf_backend.py tests/test_fitshelf_tryon.py tests/test_fitshelf_app_static.py` passed with 15 tests.
- `py -m compileall ai/backend ai/fitshelf_tryon ai/scripts` passed.
- Live backend on temporary port 8043 returned schema health `ok=false`, schema `patch_file=ai/supabase/stabilization_patch.sql`, DB `priority_tables_ok=false`, DB `patch_file=ai/supabase/stabilization_patch.sql`, and the same `person_images.image_url` schema-cache error.
- Expo bundle smoke on temporary port 8123 returned HTTP 200 with a 22,089,490-byte bundle.
- `rg "SUPABASE_SERVICE_ROLE_KEY|SERVICE_ROLE" fitshelf-app -n` returned no matches.
- Temporary ports 8043 and 8123 were not left running.

Active blocker:
- Apply `ai/supabase/stabilization_patch.sql`, then rerun backend schema/db health and physical-device verification.
## 2026-05-11T13:50 - Try-On Contract Static Test

Current status:
- Extended `tests/test_fitshelf_app_static.py` with a Try-On panel contract test.
- The test verifies Save Person/Garment/Look controls, backend schema/DB gates, schema-failed save blocking, patch hint, durable `resultStoragePath`, Supabase storage path, signed URL refresh, backend proxy fallback, local result fallback, cache-busting, and image error recovery.
- Focused test count is now 14 passing tests.

Verified:
- `npm run typecheck` passed.
- `py -m pytest tests/test_fitshelf_backend.py tests/test_fitshelf_tryon.py tests/test_fitshelf_app_static.py` passed with 14 tests.
- `py -m compileall ai/backend ai/fitshelf_tryon ai/scripts` passed.
- Live backend on temporary port 8042 returned schema health `ok=false`, schema `patch_file=ai/supabase/stabilization_patch.sql`, DB `priority_tables_ok=false`, DB `patch_file=ai/supabase/stabilization_patch.sql`, and the same `person_images.image_url` schema-cache error.
- Expo bundle smoke on temporary port 8122 returned HTTP 200 with a 22,089,490-byte bundle.
- `rg "SUPABASE_SERVICE_ROLE_KEY|SERVICE_ROLE" fitshelf-app -n` returned no matches.
- Temporary ports 8042 and 8122 were not left running.

Active blocker:
- Apply `ai/supabase/stabilization_patch.sql`, then rerun backend schema/db health and physical-device verification.
## 2026-05-11T13:46 - Avatar Contract Static Test

Current status:
- Added `tests/test_fitshelf_app_static.py`.
- The test verifies the Avatar panel keeps the GLB path, `useGLTF`, pan/pinch handlers, numeric TextInputs, sliders, unsupported morph note, and no `CapsuleGeometry` reference.
- Focused test count is now 13 passing tests.

Verified:
- `npm run typecheck` passed.
- `py -m pytest tests/test_fitshelf_backend.py tests/test_fitshelf_tryon.py tests/test_fitshelf_app_static.py` passed with 13 tests.
- `py -m compileall ai/backend ai/fitshelf_tryon ai/scripts` passed.
- Live backend on temporary port 8041 returned schema health `ok=false`, schema `patch_file=ai/supabase/stabilization_patch.sql`, DB `priority_tables_ok=false`, DB `patch_file=ai/supabase/stabilization_patch.sql`, and the same `person_images.image_url` schema-cache error.
- Expo bundle smoke on temporary port 8121 returned HTTP 200 with a 22,089,490-byte bundle.
- `rg "SUPABASE_SERVICE_ROLE_KEY|SERVICE_ROLE" fitshelf-app -n` returned no matches.
- Temporary ports 8041 and 8121 were not left running.

Active blocker:
- Apply `ai/supabase/stabilization_patch.sql`, then rerun backend schema/db health and physical-device verification.
## 2026-05-11T13:42 - DB Health Docs Include Patch File

Current status:
- `ai/supabase/README.md` now shows `patch_file: ai/supabase/stabilization_patch.sql` in the expected `/supabase/db-health` response.
- This matches the backend response and the Try-On `Test Backend DB` failure message.

Verified:
- `npm run typecheck` passed.
- `py -m pytest tests/test_fitshelf_backend.py tests/test_fitshelf_tryon.py` passed with 12 tests.
- `py -m compileall ai/backend ai/fitshelf_tryon ai/scripts` passed.
- Live backend on temporary port 8040 returned schema health `ok=false`, schema `patch_file=ai/supabase/stabilization_patch.sql`, DB `priority_tables_ok=false`, DB `patch_file=ai/supabase/stabilization_patch.sql`, and the same `person_images.image_url` schema-cache error.
- Expo bundle smoke on temporary port 8120 returned HTTP 200 with a 22,089,490-byte bundle.
- `rg "SUPABASE_SERVICE_ROLE_KEY|SERVICE_ROLE" fitshelf-app -n` returned no matches.
- Temporary ports 8040 and 8120 were not left running.

Active blocker:
- Apply `ai/supabase/stabilization_patch.sql`, then rerun backend schema/db health and physical-device verification.
## 2026-05-11T13:39 - DB Health Returns Patch File

Current status:
- `/supabase/db-health` now returns `patch_file: ai/supabase/stabilization_patch.sql`.
- Try-On `Test Backend DB` reads `patch_file` from the backend response instead of hardcoding the path.
- Backend tests assert the DB health success and failure responses include the patch file.

Verified:
- `npm run typecheck` passed.
- `py -m pytest tests/test_fitshelf_backend.py tests/test_fitshelf_tryon.py` passed with 12 tests.
- `py -m compileall ai/backend ai/fitshelf_tryon ai/scripts` passed.
- Live backend on temporary port 8039 returned schema health `ok=false`, schema `patch_file=ai/supabase/stabilization_patch.sql`, DB `priority_tables_ok=false`, DB `patch_file=ai/supabase/stabilization_patch.sql`, and the same `person_images.image_url` schema-cache error.
- Expo bundle smoke on temporary port 8119 returned HTTP 200 with a 22,089,490-byte bundle.
- `rg "SUPABASE_SERVICE_ROLE_KEY|SERVICE_ROLE" fitshelf-app -n` returned no matches.
- Temporary ports 8039 and 8119 were not left running.

Active blocker:
- Apply `ai/supabase/stabilization_patch.sql`, then rerun backend schema/db health and physical-device verification.
## 2026-05-11T13:35 - Backend DB Failure Contract Test

Current status:
- Added a backend regression test for `/supabase/db-health` failure responses when `priority_tables_ok=false`.
- The test verifies the response preserves `profile_*` flags, `priority_tables_ok=false`, and the missing `person_images.image_url` error context used by the phone's `Test Backend DB` action.

Verified:
- `npm run typecheck` passed.
- `py -m pytest tests/test_fitshelf_backend.py tests/test_fitshelf_tryon.py` passed with 12 tests.
- `py -m compileall ai/backend ai/fitshelf_tryon ai/scripts` passed.
- Live backend on temporary port 8038 returned schema health `ok=false`, `patch_file=ai/supabase/stabilization_patch.sql`, DB `priority_tables_ok=false`, and the same `person_images.image_url` schema-cache error.
- Expo bundle smoke on temporary port 8118 returned HTTP 200 with a 22,089,361-byte bundle.
- `rg "SUPABASE_SERVICE_ROLE_KEY|SERVICE_ROLE" fitshelf-app -n` returned no matches.
- Temporary ports 8038 and 8118 were not left running.

Active blocker:
- Apply `ai/supabase/stabilization_patch.sql`, then rerun backend schema/db health and physical-device verification.
## 2026-05-11T13:31 - In-App Backend DB Health Gate

Current status:
- Try-On now includes `Test Backend DB` beside `Test Backend Schema`.
- The action calls the configured backend URL's `/supabase/db-health` and requires `priority_tables_ok=true`.
- If backend DB health fails, Try-On blocks Save Person/Garment/Look with the same schema readiness gate and tells the operator to run `ai/supabase/stabilization_patch.sql`.
- `fitshelf-app/README.md` and `ai/supabase/README.md` now include `Test Backend DB` in the phone checklist.

Verified:
- `npm run typecheck` passed.
- `py -m pytest tests/test_fitshelf_backend.py tests/test_fitshelf_tryon.py` passed with 11 tests.
- `py -m compileall ai/backend ai/fitshelf_tryon ai/scripts` passed.
- Live backend on temporary port 8037 returned schema health `ok=false`, `patch_file=ai/supabase/stabilization_patch.sql`, DB `priority_tables_ok=false`, and DB error `person_images write returned 400` because `person_images.image_url` is missing from the PostgREST schema cache.
- Expo bundle smoke on temporary port 8117 returned HTTP 200 with a 22,089,361-byte bundle.
- `rg "SUPABASE_SERVICE_ROLE_KEY|SERVICE_ROLE" fitshelf-app -n` returned no matches.
- Temporary ports 8037 and 8117 were not left running.

Active blocker:
- Apply `ai/supabase/stabilization_patch.sql`, then rerun backend schema/db health and physical-device verification.
## 2026-05-11T13:26 - Manual Phone Checklist Docs Updated

Current status:
- `fitshelf-app/README.md` now lists the exact manual phone persistence sequence: apply patch, pass backend schema health, pass backend DB health, then run phone debug checks and save flows.
- `ai/supabase/README.md` now documents the expected `/supabase/db-health` result with `priority_tables_ok=true`.
- `ai/supabase/README.md` now includes a physical phone persistence checklist that maps each priority table to the row the tester should confirm.

Verified:
- `npm run typecheck` passed.
- `py -m pytest tests/test_fitshelf_backend.py tests/test_fitshelf_tryon.py` passed with 11 tests.
- `py -m compileall ai/backend ai/fitshelf_tryon ai/scripts` passed.
- Live backend schema health on temporary port 8036 still returned the known missing columns and `patch_file=ai/supabase/stabilization_patch.sql`.
- Expo bundle smoke on temporary port 8116 returned HTTP 200 with a 22,086,318-byte bundle.
- `rg "SUPABASE_SERVICE_ROLE_KEY|SERVICE_ROLE" fitshelf-app -n` returned no matches.
- Temporary ports 8036 and 8116 were not left running.

Active blocker:
- Apply `ai/supabase/stabilization_patch.sql`, then rerun backend schema/db health and physical-device verification.
## 2026-05-11T13:23 - Local-Only Save Messages Are Explicit

Current status:
- Save Person now says `Person image saved to Supabase` only when a real Supabase storage path exists.
- If no storage path exists, Save Person says it was saved locally only and instructs the operator to sign in, run `Test Asset Upload`, and save again for Supabase rows.
- Save Garment now has the same explicit Supabase/local-only distinction.

Verified:
- `npm run typecheck` passed.
- `py -m pytest tests/test_fitshelf_backend.py tests/test_fitshelf_tryon.py` passed with 11 tests.
- `py -m compileall ai/backend ai/fitshelf_tryon ai/scripts` passed.
- Live backend schema health on temporary port 8035 still returned the known missing columns and `patch_file=ai/supabase/stabilization_patch.sql`.
- Expo bundle smoke on temporary port 8115 returned HTTP 200 with a 22,086,318-byte bundle.
- `rg "SUPABASE_SERVICE_ROLE_KEY|SERVICE_ROLE" fitshelf-app -n` returned no matches.
- Temporary ports 8035 and 8115 were not left running.

Active blocker:
- Apply `ai/supabase/stabilization_patch.sql`, then rerun backend schema/db health and physical-device verification.
## 2026-05-11T13:19 - App DB Errors Include Patch Hint

Current status:
- App-side Supabase error sanitization now appends the exact `ai/supabase/stabilization_patch.sql` instruction when PostgREST reports a missing column/schema-cache error.
- This means `Test DB Write`, Save Person/Garment, Saved Looks, and avatar persistence errors can point the phone tester to the same patch file as `Test Backend Schema`.

Verified:
- `npm run typecheck` passed.
- `py -m pytest tests/test_fitshelf_backend.py tests/test_fitshelf_tryon.py` passed with 11 tests.
- `py -m compileall ai/backend ai/fitshelf_tryon ai/scripts` passed.
- Live backend schema health on temporary port 8034 still returned the known missing columns and `patch_file=ai/supabase/stabilization_patch.sql`.
- Expo bundle smoke on temporary port 8114 returned HTTP 200 with a 22,086,045-byte bundle.
- `rg "SUPABASE_SERVICE_ROLE_KEY|SERVICE_ROLE" fitshelf-app -n` returned no matches.
- Temporary ports 8034 and 8114 were not left running.

Active blocker:
- Apply `ai/supabase/stabilization_patch.sql`, then rerun backend schema/db health and physical-device verification.
## 2026-05-11T13:05 - Latest Checkpoint Pointer

Current status:
- Latest code change is the visible schema-blocked save message in Try-On.
- Verification at 13:05 is recorded in `PROOF.md`, `BLOCKERS.md`, `DECISIONS.md`, and `RESUME.md`.
- The active blocker is unchanged: apply `ai/supabase/stabilization_patch.sql`, then run backend schema/db health and physical-device tests.
## 2026-05-11T13:05 - Schema-Blocked Save UI Hint

Current status:
- Try-On now shows an explicit message when a failed backend schema check blocks cloud save actions.
- The blocked state still disables `Save Person`, `Save Garment`, and `Save Look` until schema health passes or the backend URL changes.
- Try-On debug/history separators were normalized to ASCII so the phone UI does not show mojibake characters.

Completion audit:
- Code-level stabilization is implemented for the requested persistence surfaces, result image fallback, GLB avatar path, auth redirect handling, and visible debug actions.
- Live Supabase schema health still fails because the stabilization SQL has not been applied to the project.
- The workspace has no Supabase CLI link or DDL-capable database URL, so the patch cannot be applied from this shell.
- Required physical-device proof remains incomplete.

Verified:
- `npm run typecheck` passed.
- `py -m pytest tests/test_fitshelf_backend.py tests/test_fitshelf_tryon.py` passed with 11 tests.
- `py -m compileall ai/backend ai/fitshelf_tryon ai/scripts` passed.
- Live backend schema health on temporary port 8031 returned the same missing column list and `patch_file=ai/supabase/stabilization_patch.sql`.
- Expo bundle smoke on temporary port 8111 returned HTTP 200 with a 22,083,285-byte bundle.
- `rg "SUPABASE_SERVICE_ROLE_KEY|SERVICE_ROLE" fitshelf-app -n` returned no matches.
- Temporary ports 8031 and 8111 were not left running.

Active blocker:
- Apply `ai/supabase/stabilization_patch.sql`, then rerun schema/db health and phone tests.
## 2026-05-11T12:46 - In-App Backend Schema Check

Current status:
- Try-On panel now includes `Test Backend Schema` beside the backend URL field.
- The action calls `/supabase/schema-health` using the same backend URL the phone uses for rendering.
- The app can now display missing backend/Supabase schema columns directly on the device before a render attempt.
- `fitshelf-app/README.md` documents the new action.

Verified:
- `npm run typecheck` passed.
- `py -m pytest tests/test_fitshelf_backend.py tests/test_fitshelf_tryon.py` passed with 11 tests.
- `py -m compileall ai/backend ai/fitshelf_tryon ai/scripts` passed.
- Live backend schema health on temporary port 8027 returned the known exact missing list.
- Expo bundle smoke on temporary port 8107 returned HTTP 200 with a 22,081,865-byte bundle.
- `rg "SUPABASE_SERVICE_ROLE_KEY|SERVICE_ROLE" fitshelf-app -n` returned no matches.

Active blocker:
- Apply `ai/supabase/stabilization_patch.sql`; then `Test Backend Schema` should pass on the phone.
## 2026-05-11T12:50 - PostgREST Schema Cache Reload In Patch

Current status:
- `ai/supabase/stabilization_patch.sql` and full `ai/supabase/schema.sql` now end with `notify pgrst, 'reload schema';`.
- Supabase setup docs note that the patch reloads PostgREST schema cache after column changes.

Verified:
- `npm run typecheck` passed.
- `py -m pytest tests/test_fitshelf_backend.py tests/test_fitshelf_tryon.py` passed with 11 tests.
- `py -m compileall ai/backend ai/fitshelf_tryon ai/scripts` passed.
- Live schema health on temporary port 8028 still shows the same missing columns because the patch has not been applied yet.
- Expo bundle smoke on temporary port 8108 returned HTTP 200 with a 22,081,865-byte bundle.
- `rg "SUPABASE_SERVICE_ROLE_KEY|SERVICE_ROLE" fitshelf-app -n` returned no matches.

Active blocker:
- Apply `ai/supabase/stabilization_patch.sql` in Supabase SQL editor.
## 2026-05-11T12:53 - Schema Health Patch Hint

Current status:
- `/supabase/schema-health` now returns `patch_file: ai/supabase/stabilization_patch.sql`.
- On schema failure, the backend error now says to run `ai/supabase/stabilization_patch.sql`.
- Try-On `Test Backend Schema` displays that patch file path in the phone UI.

Verified:
- `npm run typecheck` passed.
- `py -m pytest tests/test_fitshelf_backend.py tests/test_fitshelf_tryon.py` passed with 11 tests.
- `py -m compileall ai/backend ai/fitshelf_tryon ai/scripts` passed.
- Live schema health on temporary port 8029 returned `patch_file=ai/supabase/stabilization_patch.sql` and the exact missing column list.
- Expo bundle smoke on temporary port 8109 returned HTTP 200 with a 22,082,056-byte bundle.
- `rg "SUPABASE_SERVICE_ROLE_KEY|SERVICE_ROLE" fitshelf-app -n` returned no matches.

Active blocker:
- Apply `ai/supabase/stabilization_patch.sql`.
## 2026-05-11T13:00 - Schema Failure Gates Save Actions

Current status:
- Try-On now tracks backend schema readiness after `Test Backend Schema`.
- If the schema check fails, `Save Person`, `Save Garment`, and `Save Look` are disabled until the backend URL changes or a later schema check passes.
- This prevents known-bad writes to `person_images`, `wardrobe_items`, and `saved_looks` while the live Supabase schema is still missing stabilization columns.

Verified:
- `npm run typecheck` passed.
- `py -m pytest tests/test_fitshelf_backend.py tests/test_fitshelf_tryon.py` passed with 11 tests.
- `py -m compileall ai/backend ai/fitshelf_tryon ai/scripts` passed.
- Live backend schema health on temporary port 8030 returned `patch_file=ai/supabase/stabilization_patch.sql` and the known missing column list.
- Expo bundle smoke on temporary port 8110 returned HTTP 200 with a 22,082,825-byte bundle.
- `rg "SUPABASE_SERVICE_ROLE_KEY|SERVICE_ROLE" fitshelf-app -n` returned no matches.

Active blocker:
- Apply `ai/supabase/stabilization_patch.sql` in Supabase SQL editor.
## 2026-05-11T13:05 - Latest Checkpoint Pointer

Current status:
- Latest code change is the visible schema-blocked save message in Try-On.
- Verification at 13:05 is recorded in `PROOF.md`, `BLOCKERS.md`, `DECISIONS.md`, and `RESUME.md`.
- The active blocker is unchanged: apply `ai/supabase/stabilization_patch.sql`, then run backend schema/db health and physical-device tests.
