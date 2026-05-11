
---

# `vault/projects/fitshelf/BLOCKERS.md`

```md
# FitShelf Blockers

Document blockers here.

Format:

```md
## YYYY-MM-DD HH:MM - Blocker Title

Blocker:
...

Impact:
...

Attempted Fixes:
...

Workaround:
...

Required Human Action:
...

## 2026-05-10 19:13 - CatVTON Model Not Configured

Blocker:
No CatVTON checkout, weights, or runnable command is configured in this workspace.

Impact:
The local pipeline cannot produce real diffusion-based virtual try-on output yet.

Attempted Fixes:
Implemented a `FITSHELF_CATVTON_COMMAND` integration point in `ai/fitshelf_tryon/pipeline.py` and verified that the pipeline detects the missing command.

Workaround:
Use the deterministic local fallback renderer to prove the CLI, preprocessing, output artifact, API, and queue surfaces while preserving a stable handoff to CatVTON.

Required Human Action:
Provide or approve installing a CatVTON repository and model weights, then set `FITSHELF_CATVTON_COMMAND` with placeholders `{person}`, `{garment}`, `{category}`, and `{out}`.

## 2026-05-10 19:13 - `python` Launcher Alias Fails On PATH

Blocker:
Running `python` invokes the Microsoft Store alias and fails in this shell. The Windows `py` launcher and `C:\Users\benwe\AppData\Local\Python\bin\python.exe` both work.

Impact:
The exact command text from the goal fails if executed with bare `python` in this environment, even though the script itself works.

Attempted Fixes:
Verified `py --version` and verified the full interpreter path. Installed required packages into the active Python 3.14 environment.

Workaround:
Use `py ai/scripts/run_tryon.py ...` or the full interpreter path until the PATH/App Execution Alias configuration is corrected.

Required Human Action:
Disable the Microsoft Store `python.exe` alias or move the real Python install ahead of the alias on PATH if the bare `python` command must work.

## 2026-05-10 19:43 - CatVTON Blocker Resolved For Local CUDA Smoke

Blocker:
Previous CatVTON blocker was missing repository, model integration, Python 3.9 environment, dependencies, and CUDA Torch.

Impact:
Resolved for local smoke inference. Full-quality production inference still needs longer inference settings and real user photos.

Attempted Fixes:
Cloned official CatVTON to `ai/vendor/CatVTON`, installed Python 3.9 via Windows Python Manager, created `ai/.venv-catvton`, installed a Windows-compatible CatVTON requirements overlay, replaced CPU Torch with `torch==2.4.0+cu121` / `torchvision==0.19.0+cu121`, downloaded Hugging Face model snapshots into `ai/models`, and ran real CatVTON inference.

Workaround:
Use low smoke settings for fast verification: `CATVTON_WIDTH=384`, `CATVTON_HEIGHT=512`, `CATVTON_STEPS=1`, `CATVTON_MIXED_PRECISION=fp16`.

Required Human Action:
None for local smoke execution. For production use, confirm CatVTON's CC BY-NC-SA non-commercial license is acceptable or obtain separate commercial rights.

## 2026-05-10 20:06 - Remaining Local App Runtime Caveats

Blocker:
No hard blocker for the local API flow. Remaining caveats are environment/runtime related.

Impact:
Physical mobile devices may not reach `127.0.0.1`; they usually need the workstation LAN IP in `EXPO_PUBLIC_FITSHELF_BACKEND_URL` or the Try-On panel backend field.

Attempted Fixes:
Added `.env.example` backend URL values, made the Try-On panel backend URL editable, documented `--host 0.0.0.0`, and verified FastAPI `/tryon` plus `/jobs/{job_id}` with CatVTON.

Workaround:
Use `http://127.0.0.1:8000` for emulator/local web contexts that share localhost, or `http://<workstation-lan-ip>:8000` for a physical device.

Required Human Action:
None unless testing on a physical device, where the operator must use the workstation LAN IP.

## 2026-05-10T23:56 - Full Repo Pytest Has Non-FitShelf Failures

Blocker:
`py -m pytest` does not fully pass for the whole OneShot repository on this Windows environment.

Impact:
This does not block the FitShelf backend/app path, but it prevents claiming a fully green repo-wide pytest run.

Attempted Fixes:
Scoped pytest discovery to `tests/` so vendored CatVTON source files are not collected as project tests. Re-ran full pytest.

Workaround:
Use the focused FitShelf regression command for this project checkpoint: `py -m pytest tests/test_fitshelf_backend.py tests/test_fitshelf_tryon.py`, which passes.

Required Human Action:
None for FitShelf continuation. If repo-wide green status is required, fix the separate Windows path normalization failures, provide `ffmpeg` for video-evidence tests, and review the existing phase-probe expectation failure.

## 2026-05-10T23:56 - 1-Step CatVTON Smoke Output Is Not Quality Output

Blocker:
`CATVTON_STEPS=1` produces visually corrupted/noisy output.

Impact:
The smoke setting proves the request path but cannot be used for visual evaluation in the app.

Attempted Fixes:
Ran controlled outputs at 1 step, 8 steps, `fp16`, `no` mixed precision, and `384x512` versus `768x1024`. Updated backend defaults to quality settings.

Workaround:
Use `CATVTON_STEPS=8` or higher for visual checks. Keep `CATVTON_STEPS=50`, `CATVTON_WIDTH=768`, `CATVTON_HEIGHT=1024`, and `CATVTON_MIXED_PRECISION=no` in `ai/backend/.env` for backend quality runs.

Required Human Action:
None for local quality testing. Expect slower backend responses when using quality settings.

## 2026-05-11T00:36 - Expo Audit Has Moderate Transitive Advisories

Blocker:
`npm audit --audit-level=moderate` reports 4 moderate advisories through Expo CLI / Metro config / PostCSS.

Impact:
No high or critical advisory remains after avoiding `expo-three`, but the audit command is not fully green.

Attempted Fixes:
Removed `expo-three` after it introduced high-severity old browser polyfill dependencies. Switched the 3D foundation to `@react-three/fiber/native` with Expo GL and reran typecheck and Expo bundle smoke.

Workaround:
Keep current Expo SDK 54-compatible packages. Do not run `npm audit fix --force` because the reported fix path suggests a semver-major Expo downgrade/shift that is not appropriate inside this checkpoint.

Required Human Action:
None for local development. Reassess dependency advisories during a dedicated dependency-upgrade pass.

## 2026-05-11T00:36 - 3D Avatar Is Foundation Only

Blocker:
The 3D section does not perform real clothing simulation or GLB garment fitting.

Impact:
The app has an avatar viewer and local measurements, but CatVTON remains the try-on renderer.

Attempted Fixes:
Added a rotatable/zoomable procedural avatar scene, a default `.glb` asset placeholder, and saved local measurements without changing CatVTON.

Workaround:
Use CatVTON for generated outfit images. Treat the 3D avatar as profile/foundation work until real 3D clothing simulation is separately scoped.

Required Human Action:
Provide or select a production mannequin GLB asset when visual polish is in scope.

## 2026-05-11T01:22 - Live Supabase Persistence Needs Operator Verification

Blocker:
The code path for Supabase Storage/database persistence is implemented, but live writes were not executed in this session.

Impact:
Local tests verify payload behavior and fallback behavior, but end-to-end Supabase persistence still needs schema/bucket setup and an authenticated user session.

Attempted Fixes:
Added backend service-role Storage upload with local URL fallback, added `saved_looks` and `avatar_profiles` tables with RLS policies, and added Expo-side local/Supabase persistence branches.

Workaround:
The app still saves Saved Looks and avatar profiles locally through AsyncStorage when Supabase is unavailable or the user is not signed in.

Required Human Action:
Apply `ai/supabase/schema.sql`, ensure `SUPABASE_TRYON_BUCKET` exists, sign in through the Expo app, and run a physical-device try-on to verify cloud persistence.

## 2026-05-11T01:34 - Authenticated App Database Sync Needs Device Test

Blocker:
Backend Supabase Storage upload/signing is live-verified, but Expo-side authenticated table writes have not been verified on a physical device with a real signed-in session.

Impact:
The app has local fallback and compiles/bundles, but final confidence for Saved Looks and Avatar profile cloud sync needs one manual phone pass.

Attempted Fixes:
Added session restoration, sign-out, sync indicators, `Test Supabase`, local-first writes, and graceful sync-failure messages.

Workaround:
If the user is signed out or Supabase insert fails, Saved Looks and Avatar profile remain preserved locally through AsyncStorage.

Required Human Action:
Sign in on the phone, tap `Test Supabase`, then create/rename/delete a Saved Look and save Avatar measurements to confirm cloud persistence.
## 2026-05-11T02:17 - Physical Device Signed Image And GLB Confirmation

Status: partially blocked on operator device verification.

What is verified:
- Backend upload, bucket check, signed URL creation, and explicit signed URL regeneration all pass against configured Supabase.
- Metro bundles the Expo app with the updated R3F native avatar implementation.

What still needs physical-device verification:
- Initial CatVTON result image renders from the Supabase signed URL in React Native `Image`.
- A stale/failed signed URL refreshes and reloads without a blank result.
- Reopened Saved Looks refresh from `resultStoragePath` or fall back to `localResultUrl`.
- The regenerated `.glb` loads on the target Expo Go device; if it does not, the procedural fallback should display instead of a blank canvas.
## 2026-05-11T03:00 - Remaining External Verification And CatV2TON Blockers

App-side Supabase verification:
- Backend service-role DB health passes for `profiles`.
- The app-side `Test DB Write` action is implemented, but it still needs a real signed-in Supabase session on the phone to verify RLS writes through the anon key.
- If email confirmation is enabled in Supabase Auth, signup will not create a profile row until the user confirms email and signs in with a session.

Physical-device image verification:
- Direct signed URL and backend proxy URL both return HTTP 200 from the workstation.
- React Native image rendering still needs a phone pass for fresh signed URL, refreshed signed URL, proxy fallback, and reopened Saved Looks.

Avatar verification:
- Runtime CapsuleGeometry fallback was removed and numeric scales are sanitized.
- Expo Go GLB rendering still depends on device/runtime behavior. The screen should show a loading state and then either the GLB or a non-capsule fallback.

CatV2TON blocker:
- The official repo is cloned and dependency visibility passes in `ai/.venv-catvton`.
- Full inference is blocked because upstream provides dataset-style VITONHD/DressCode image scripts with DensePose/mask conditions, not a direct person/garment/out CLI.
- CatV2TON remains optional and disabled until a safe single-image adapter is built and license/VRAM requirements are confirmed.
## 2026-05-11T10:50 - Remaining Device Verification

Status: not blocked for code, but blocked for final real-device proof.

What is verified locally:
- Backend service-role DB smoke passes.
- Backend signed URL and proxy fetch both return HTTP 200.
- Expo bundles with the GLB avatar code.
- No service-role key is present in Expo code.

What still requires the phone:
- Sign in with a confirmed Supabase user.
- Tap `Test DB Write` and confirm `profiles`, `avatar_profiles`, and `saved_looks` behavior from the anon-key client.
- Run a try-on and confirm the React Native `Image` displays the signed URL; if it fails twice, confirm the backend proxy fallback renders.
- Open Avatar and confirm the GLB model loads on Expo Go rather than falling back.
## 2026-05-11T11:13 - Supabase Redirect Dashboard Setup Required

Status: requires operator action in Supabase Dashboard.

The app now generates and passes the correct Expo auth redirect URL, but
Supabase must allow-list it:

```text
Authentication -> URL Configuration -> Redirect URLs
```

Add the exact redirect URL shown on the FitShelf sign-in screen. For production,
also add:

```text
fitshelf://auth/callback
```

If Supabase still sends users to `http://localhost:3000/#access_token=...`, the
Dashboard URL configuration is still missing the active Expo redirect URL or the
signup was created before the redirect change.
## 2026-05-11T11:59 - Remaining Phone Persistence Confirmation

Status: blocked on operator physical-device verification.

What is verified locally:
- App typecheck passes with explicit Save Person, Save Garment, and Save Look controls.
- App-side `Test DB Write` now covers `profiles`, `person_images`, `wardrobe_items`, `tryon_jobs`, `saved_looks`, and `avatar_profiles`.
- Backend service-role Supabase Storage and DB health checks pass.
- Expo bundles with the touch-gesture avatar implementation.

What still requires the phone:
- Sign in with a confirmed Supabase user.
- Tap `Test DB Write` and confirm the UI reports every priority table writable.
- Tap `Save Person` and confirm a `person_images` row appears with the signed-in `user_id`.
- Tap `Save Garment` and confirm a `wardrobe_items` row appears with the signed-in `user_id`.
- Run Preview, then confirm a `tryon_jobs` row appears with the signed-in `user_id`.
- Tap `Save Look`, restart/navigate, and confirm a `saved_looks` row reloads with `tryon_job_id`, `result_storage_path`, and the signed-in `user_id`.
- Open Avatar on the device and confirm drag rotation, pinch zoom, GLB load or graceful fallback, and avatar profile persistence.
## 2026-05-11T12:08 - Storage Policy Confirmation Still Required

Status: partially resolved.

What changed:
- The live `fitshelf-assets` bucket was missing and has now been created as a public Supabase Storage bucket.
- `ai/supabase/schema.sql` now includes the `fitshelf-assets` bucket, `tryon-results` bucket, and the `fitshelf assets own objects` storage policy.

Remaining blocker:
- This shell does not have `psql`, Supabase CLI, or a database connection string, so the storage RLS policy could not be applied directly from here.

Impact:
- Backend service-role checks now confirm both buckets exist.
- Actual phone Save Person/Save Garment uploads through the anon-key user session still need the storage policy to be present.

Required human action:
- In Supabase SQL editor, apply the latest `ai/supabase/schema.sql`, or at minimum confirm the `fitshelf assets own objects` policy exists on `storage.objects`.
## 2026-05-11T12:14 - Physical GLB Rendering Confirmation Still Required

Status: blocked on target device verification.

What is verified locally:
- The GLB asset parses with Three.js `GLTFLoader`.
- The GLB has 19 meshes, root `FitShelfDefaultGlbMannequin`, and 0 non-finite vertices.
- No `CapsuleGeometry` references remain in the avatar source or generator.
- Expo bundles successfully with the regenerated GLB.

What still requires the phone:
- Confirm Expo Go downloads/resolves `default-mannequin.glb`.
- Confirm the Avatar panel status changes from `Loading` to `GLB`.
- Confirm drag rotation and pinch zoom work on the rendered GLB.
- Confirm the procedural fallback appears only if the GLB load actually fails.
## 2026-05-11T12:19 - App-Side Asset Upload Needs Phone Proof

Status: blocked on signed-in phone verification.

What is verified locally:
- The `fitshelf-assets` bucket exists.
- Backend service-role health can see the asset bucket.
- Expo bundles the new `Test Asset Upload` action.

What still requires the phone:
- Tap `Test Asset Upload` while signed in.
- Confirm it reports `Supabase asset upload passed`.
- If it fails, use the sanitized message to fix the `fitshelf assets own objects` policy in Supabase.
## 2026-05-11T12:23 - Result Image Fallback Needs Device Proof

Status: blocked on physical-device image rendering verification.

What is verified locally:
- Backend signed URL and object proxy health pass.
- Expo bundles with the tightened fallback order.

What still requires the phone:
- Generate a Preview result.
- If the signed image fails, confirm the app switches to backend proxy/local fallback and does not remain blank.
- Reopen a Saved Look after navigation/restart and confirm it refreshes from `resultStoragePath`.
## 2026-05-11T12:26 - Manual Drafts Are Local-Only

Status: intentional scope boundary for this stabilization pass.

What is fixed:
- The old Outfits surface is labeled as `manual`.
- Saved manual composites are labeled `Manual Drafts`.
- The screen states that Supabase-backed generated result persistence is in Try-On Saved Looks.

Impact:
- This avoids implying that local manual drafts are part of the priority Supabase persistence path.

Future work:
- If cloud persistence for manual layered outfit drafts is required, add an explicit `outfits` schema/table and RLS policy in a separate scoped pass.
## 2026-05-11T12:29 - Live Supabase Schema Missing Priority Columns

Status: active blocker for final phone persistence proof.

Evidence:
- Expanded `/supabase/db-health` writes/reads/deletes harmless rows across all priority tables.
- Live check failed on `person_images` because the live schema is missing the `image_url` column.

Impact:
- Save Person can upload to Storage, but the corresponding `person_images` table write/reload path will fail until the schema cache includes the latest columns.
- Full priority persistence cannot be considered complete until `/supabase/db-health` reports `priority_tables_ok=true`.

Required human action:
- In Supabase SQL editor, run `ai/supabase/stabilization_patch.sql` or reapply the latest `ai/supabase/schema.sql`.
- Then restart/rerun backend and request `GET /supabase/db-health`.
- Expected after fix: `priority_tables_ok=true` and `error=null`.
## 2026-05-11T12:35 - Debug Checks Are Safer But Schema Blocker Remains

Status: active blocker unchanged.

What changed:
- Backend and app debug checks now clean up transient rows on failure.
- App `Test DB Write` restores the user's previous avatar profile after the check.

Remaining blocker:
- Live Supabase still lacks `person_images.image_url`.
- Apply `ai/supabase/stabilization_patch.sql`, then rerun `/supabase/db-health`.
## 2026-05-11T12:38 - Schema Health Lists Missing Patch Areas

Status: active blocker unchanged, now easier to verify.

Live `/supabase/schema-health` missing areas:
- `person_images` stabilization columns such as `label` and `image_url`.
- `wardrobe_items` stabilization columns such as `color`, `favorite`, and `image_url`.
- `saved_looks.tryon_job_id`.

Required human action:
- Run `ai/supabase/stabilization_patch.sql`.
- Verify `/supabase/schema-health` returns `ok=true`.
- Verify `/supabase/db-health` returns `priority_tables_ok=true`.
## 2026-05-11T12:42 - Exact Missing Columns Before Patch

Status: active blocker unchanged.

Missing live columns:
- `person_images.label`
- `person_images.image_url`
- `wardrobe_items.color`
- `wardrobe_items.favorite`
- `wardrobe_items.image_url`
- `saved_looks.tryon_job_id`
- `saved_looks.result_storage_path`
- `saved_looks.local_result_url`

Required human action:
- Run `ai/supabase/stabilization_patch.sql` in Supabase SQL editor.
## 2026-05-11T12:46 - Backend Schema Check Available On Phone

Status: blocker unchanged, but now visible on-device.

What changed:
- Try-On panel has `Test Backend Schema`.
- The button reports the same missing columns as `/supabase/schema-health` using the phone's configured backend URL.

Required human action:
- Apply `ai/supabase/stabilization_patch.sql`.
- On phone, tap `Test Backend Schema` and confirm it passes before running Preview/Save Look.
## 2026-05-11T12:50 - Patch Includes Schema Cache Reload

Status: active blocker unchanged.

What changed:
- `ai/supabase/stabilization_patch.sql` now reloads PostgREST schema cache after applying DDL.

Required human action:
- Apply the updated patch, not an older copied version.
## 2026-05-11T13:00 - App Blocks Saves After Known Schema Failure

Status: active blocker unchanged, but guarded in the app.

What changed:
- If `Test Backend Schema` fails on the phone, Try-On disables `Save Person`, `Save Garment`, and `Save Look`.
- The guard resets when the backend URL changes or when a later schema check passes.

Required human action:
- Run `ai/supabase/stabilization_patch.sql` in Supabase SQL editor.
- Confirm `Test Backend Schema` passes before trying to save cloud-backed items or looks.
## 2026-05-11T13:05 - Live Schema Patch Still Requires DDL Access

Status: active blocker.

Evidence:
- `/supabase/schema-health` still reports the exact missing stabilization columns.
- This workspace has no Supabase CLI project link and no database URL/DDL-capable credential.
- The backend service-role key can verify Storage and PostgREST table writes, but it cannot run `alter table` SQL.

Required human action:
- Apply `ai/supabase/stabilization_patch.sql` in Supabase SQL editor.
- Then verify `/supabase/schema-health` returns `ok=true`.
- Then verify `/supabase/db-health` returns `priority_tables_ok=true`.
## 2026-05-11T13:11 - Phone Test Still Required After Save Feedback

Status: active blocker unchanged.

What changed:
- Save Person/Garment now give local Try-On progress and completion/failure feedback.

Remaining blocker:
- The live schema still lacks the stabilization columns, so the real save flow cannot pass until the SQL patch is applied.
- The phone still must verify anon-key Storage upload, table writes, reload, GLB rendering, auth redirect recovery, and result image fallback.
## 2026-05-11T13:15 - Save Status Feedback Improved, Blocker Unchanged

Status: active blocker unchanged.

What changed:
- Try-On now receives and displays the exact Save Person/Garment sync status from the parent app state.

Remaining blocker:
- Live Supabase schema still needs `ai/supabase/stabilization_patch.sql`.
- Phone verification still needs to confirm the returned status matches real rows in Supabase.
## 2026-05-11T13:19 - App Now Points Missing-Column Errors To Patch

Status: active blocker unchanged.

What changed:
- App-side missing-column/schema-cache errors now include the patch file instruction.

Remaining blocker:
- The SQL patch still has to be applied in Supabase.
- Phone verification still has to prove the rows and reloads.
## 2026-05-11T13:23 - Local-Only Saves Are Visible

Status: active blocker unchanged.

What changed:
- Person/Garment save messages no longer imply Supabase persistence when the asset was saved locally only.

Remaining blocker:
- The phone still must prove real Supabase Storage paths and table rows after the SQL patch is applied.
## 2026-05-11T13:26 - Checklist Documented, Blocker Unchanged

Status: active blocker unchanged.

What changed:
- The manual phone persistence checklist is now documented in app and Supabase setup docs.

Remaining blocker:
- Live schema patch application and physical-device row/reload proof are still required.
## 2026-05-11T13:31 - Backend DB Gate Is Visible But Failing

Status: active blocker unchanged.

Evidence:
- Live `/supabase/db-health` still returns `priority_tables_ok=false`.
- The current DB error is `person_images write returned 400` because `person_images.image_url` is missing from the PostgREST schema cache.

What changed:
- The phone can now run this backend DB gate directly from Try-On with `Test Backend DB`.

Required human action:
- Apply `ai/supabase/stabilization_patch.sql`.
- Confirm `Test Backend Schema` and `Test Backend DB` both pass.
## 2026-05-11T13:35 - DB Failure Contract Covered, Blocker Unchanged

Status: active blocker unchanged.

What changed:
- `/supabase/db-health` failure response shape is now covered by a regression test.

Remaining blocker:
- The live project still needs `ai/supabase/stabilization_patch.sql`.
- `Test Backend DB` will continue to fail until the schema cache includes `person_images.image_url` and the other stabilization columns.
## 2026-05-11T13:39 - DB Health Names Patch File

Status: active blocker unchanged.

What changed:
- `/supabase/db-health` now returns the exact patch file required to resolve the live missing-column failure.

Remaining blocker:
- The SQL patch still has to be applied in Supabase.
- Backend DB health still returns `priority_tables_ok=false` until then.
## 2026-05-11T13:42 - Docs Aligned, Blocker Unchanged

Status: active blocker unchanged.

What changed:
- Supabase setup docs now show the DB health `patch_file` response field.

Remaining blocker:
- The live Supabase schema still needs `ai/supabase/stabilization_patch.sql`.
## 2026-05-11T13:46 - Avatar Contract Covered, Device Proof Still Required

Status: active blocker unchanged.

What changed:
- Static regression coverage now protects the GLB/numeric-input avatar implementation.

Remaining blocker:
- The target phone still must prove the GLB actually renders and gestures work in Expo.
- The live Supabase schema still needs the stabilization patch.
## 2026-05-11T13:50 - Try-On Contract Covered, Live Proof Still Required

Status: active blocker unchanged.

What changed:
- Static regression coverage now protects the Try-On persistence and result-image UI contract.

Remaining blocker:
- The live Supabase schema still needs the stabilization patch.
- The target phone still must prove actual rows, reloads, and image fallback behavior.
## 2026-05-11T13:53 - App Contract Covered, Live Proof Still Required

Status: active blocker unchanged.

What changed:
- Static regression coverage now protects app-side Supabase persistence, auth callback, debug actions, and service-role separation.

Remaining blocker:
- The live Supabase schema still needs the stabilization patch.
- The target phone still must prove auth redirect recovery, rows, reloads, GLB, and image fallback.
## 2026-05-11T14:00 - Patch Contract Covered, Live Proof Still Required

Status: active blocker unchanged.

What changed:
- Static regression coverage now protects the SQL stabilization patch itself.

Remaining blocker:
- The live Supabase schema still needs `ai/supabase/stabilization_patch.sql` applied.
- After the patch, `Test Backend Schema`, `Test Backend DB`, `Test DB Write`, and `Test Asset Upload` must pass before Save Person/Garment/Look phone proof.
## 2026-05-11T14:04 - Reload Scope Hardened, Blocker Unchanged

Status: active blocker unchanged.

What changed:
- Supabase reload reads for people, wardrobe, and saved looks now explicitly filter by the authenticated `user_id`.

Remaining blocker:
- The live Supabase schema still needs `ai/supabase/stabilization_patch.sql` applied.
- Phone proof is still required for persisted reloads, result images, GLB avatar rendering, gestures, and auth redirect behavior.
## 2026-05-11T14:09 - Auth Recovery Improved, Live Proof Still Required

Status: active blocker unchanged.

What changed:
- The app now has a manual pasted-callback recovery path when email verification does not reopen Expo automatically.

Remaining blocker:
- The live Supabase schema still needs `ai/supabase/stabilization_patch.sql` applied.
- The phone still must prove automatic redirect behavior or the manual `Restore callback` fallback.
## 2026-05-11T14:13 - DB Probe Hardened, Live Blocker Unchanged

Status: active blocker unchanged.

What changed:
- `Test DB Write` now scopes transient read/delete/cleanup checks by signed-in `user_id`.

Remaining blocker:
- The live Supabase schema still needs `ai/supabase/stabilization_patch.sql` applied.
- The phone still must prove actual rows, reloads, image recovery, GLB rendering, gestures, and auth callback recovery.
## 2026-05-11T14:17 - Backend DB Gate Hardened, Live Blocker Unchanged

Status: active blocker unchanged.

What changed:
- `/supabase/db-health` now scopes priority-table probes by the synthetic test `user_id`.

Remaining blocker:
- The live Supabase schema still needs `ai/supabase/stabilization_patch.sql` applied.
- The phone still must prove actual rows, reloads, image recovery, GLB rendering, gestures, and auth callback recovery.
## 2026-05-11T14:20 - GLB Asset Guarded, Device Proof Still Required

Status: active blocker unchanged.

What changed:
- Static coverage now verifies the bundled default avatar file is a real GLB asset.

Remaining blocker:
- The phone still must prove the GLB renders through Expo/R3F instead of falling back.
- The live Supabase schema still needs `ai/supabase/stabilization_patch.sql` applied.
## 2026-05-11T14:23 - GLB Geometry Guarded, Device Proof Still Required

Status: active blocker unchanged.

What changed:
- Static coverage now verifies the bundled GLB exposes finite mesh position bounds.

Remaining blocker:
- The phone still must prove the GLB renders through Expo/R3F instead of falling back.
- The live Supabase schema still needs `ai/supabase/stabilization_patch.sql` applied.
## 2026-05-11T14:27 - Expo GLB Config Guarded, Device Proof Still Required

Status: active blocker unchanged.

What changed:
- Static coverage now verifies the Expo/R3F/Metro config needed to package and load GLB assets.

Remaining blocker:
- The phone still must prove the GLB renders through Expo/R3F instead of falling back.
- The live Supabase schema still needs `ai/supabase/stabilization_patch.sql` applied.
## 2026-05-11T14:30 - Save User IDs Guarded, Live Proof Still Required

Status: active blocker unchanged.

What changed:
- Static coverage now verifies production save payloads include `user_id` for the priority persistence tables.

Remaining blocker:
- The live Supabase schema still needs `ai/supabase/stabilization_patch.sql` applied.
- The phone still must prove actual rows and reloads for the signed-in user.
## 2026-05-11T14:33 - Saved Look Fields Guarded, Live Proof Still Required

Status: active blocker unchanged.

What changed:
- Static coverage now verifies saved-look persistence writes durable result recovery fields.

Remaining blocker:
- The live Supabase schema still needs `ai/supabase/stabilization_patch.sql` applied.
- The phone still must prove saved-look rows, reloads, and image recovery.
## 2026-05-11T14:37 - Manual/Saved Looks Split Guarded, Live Proof Still Required

Status: active blocker unchanged.

What changed:
- Static coverage now guards that the old outfit builder is local-only Manual Drafts and generated results live in Try-On Saved Looks.

Remaining blocker:
- The live Supabase schema still needs `ai/supabase/stabilization_patch.sql` applied.
- The phone still must prove generated Saved Looks persist and reload.
## 2026-05-11T14:40 - Supabase Success Messages Guarded, Live Proof Still Required

Status: active blocker unchanged.

What changed:
- Static coverage now guards Save Person/Garment success messages so Supabase success requires a real storage path.

Remaining blocker:
- The live Supabase schema still needs `ai/supabase/stabilization_patch.sql` applied.
- The phone still must prove Save Person/Garment create rows and storage objects.
## 2026-05-11T14:44 - Proxy Response Guarded, Live Image Proof Still Required

Status: active blocker unchanged.

What changed:
- Backend test coverage now verifies `/supabase/sign` returns the proxy fallback URL.

Remaining blocker:
- The live Supabase schema still needs `ai/supabase/stabilization_patch.sql` applied.
- The phone still must prove signed URL refresh and proxy fallback behavior.
## 2026-05-11T14:48 - Proxy Path Encoding Fixed, Live Image Proof Still Required

Status: active blocker unchanged.

What changed:
- Backend proxy fallback URLs now encode the storage path.

Remaining blocker:
- The live Supabase schema still needs `ai/supabase/stabilization_patch.sql` applied.
- The phone still must prove signed URL refresh and proxy fallback behavior.
## 2026-05-11T14:52 - Storage Errors Point To Patch, Live Blocker Unchanged

Status: active blocker unchanged.

What changed:
- Storage-layer DB errors now include the stabilization patch hint for the current schema-cache failure mode.

Remaining blocker:
- The live Supabase schema still needs `ai/supabase/stabilization_patch.sql` applied.
- The phone still must prove persistence and reloads after the patch.
## 2026-05-11T14:56 - Upload Path Hardened, Live Proof Still Required

Status: active blocker unchanged.

What changed:
- Person/garment asset upload now uses ArrayBuffer instead of Blob for React Native compatibility.

Remaining blocker:
- The live Supabase schema still needs `ai/supabase/stabilization_patch.sql` applied.
- The phone still must prove Save Person/Garment upload to `fitshelf-assets` and create rows.
## 2026-05-11T14:59 - Debug Upload Hardened, Live Proof Still Required

Status: active blocker unchanged.

What changed:
- `Test Asset Upload` now uses ArrayBuffer instead of Blob.

Remaining blocker:
- The live Supabase schema still needs `ai/supabase/stabilization_patch.sql` applied.
- The phone still must prove `Test Asset Upload` passes and Save Person/Garment create storage objects and rows.
## 2026-05-11T15:03 - Upload Extension Guarded, Live Proof Still Required

Status: active blocker unchanged.

What changed:
- Upload object path extensions are allow-listed with fallback to `jpg` for extensionless phone URIs.

Remaining blocker:
- The live Supabase schema still needs `ai/supabase/stabilization_patch.sql` applied.
- The phone still must prove `Test Asset Upload` passes and Save Person/Garment create storage objects and rows.
- The operator-requested product URL/reusable wardrobe phase must wait until stabilization proof is complete.
## 2026-05-11T15:07 - Try-On Upload Guarded, Live Proof Still Required

Status: active blocker unchanged.

What changed:
- Try-on `FormData` upload filenames and content types now use guarded image metadata with `jpg` fallback.

Remaining blocker:
- The live Supabase schema still needs `ai/supabase/stabilization_patch.sql` applied.
- The phone still must prove Preview/HD render uploads work from picker URIs and generated looks persist/reload.
- The operator-requested product URL/reusable wardrobe phase remains queued until stabilization proof is complete.
## 2026-05-11T15:11 - GLB Loader Improved, Phone Proof Still Required

Status: avatar code improved, physical-device proof still required.

What changed:
- The GLB loader now uses the bundled asset module directly through `useGLTF(defaultAvatarModel)` instead of a downloaded `file://` URI.

Remaining blocker:
- The phone still must prove the Avatar screen reports `GLB`, centers the mannequin, and supports drag rotation plus pinch zoom.
- If the phone still reports `Fallback`, capture the in-app status/debug output and device console warning so the loader failure can be narrowed further.
- Live Supabase patch and phone persistence proof remain the primary stabilization blocker.
## 2026-05-11T15:14 - Avatar Layout Improved, Phone Proof Still Required

Status: layout code improved, physical-device proof still required.

What changed:
- Avatar measurements now wrap into a compact grid so all slider/numeric controls should be easier to reach on a phone.

Remaining blocker:
- The phone still must confirm the controls fit without overlap and that all measurements can be edited.
- The phone still must confirm GLB status, drag rotation, and pinch zoom.
- Live Supabase patch and phone persistence proof remain the primary stabilization blocker.
## 2026-05-11T15:18 - Product Workflow Deferred, Stabilization Blocker Unchanged

Status: scope guarded.

What changed:
- Product URL import is no longer exposed in the app during stabilization.

Remaining blocker:
- The product URL/reusable wardrobe phase remains deferred until the core persistence/avatar/result-image phone proof passes.
- Live Supabase patch and phone persistence proof remain the primary stabilization blocker.
## 2026-05-11T15:22 - Avatar Fallback Still Needs Phone Proof

Status: diagnostic improved, physical-device proof still required.

What changed:
- If GLB loading falls back on the phone, the Avatar viewer now displays a short failure detail instead of only `Model fallback active`.

Remaining blocker:
- The phone still must confirm the Avatar screen reports `GLB`.
- If it still reports `Fallback`, record the visible fallback detail and use that for the next loader/asset fix.
- Live Supabase patch and phone persistence proof remain the primary stabilization blocker.
## 2026-05-11T15:25 - Avatar Invalid Bounds Guarded, Phone Proof Still Required

Status: invalid-bounds handling improved, physical-device proof still required.

What changed:
- Invalid GLB scene bounds now trigger a diagnosed fallback instead of a bad scale.

Remaining blocker:
- The phone still must confirm the Avatar screen reports `GLB` and the model is centered/scaled.
- If it reports `Fallback`, record the visible fallback detail.
- Live Supabase patch and phone persistence proof remain the primary stabilization blocker.
## 2026-05-11T15:29 - Save Failure Wording Improved, Persistence Proof Still Blocked

Status: app-side failure visibility improved, physical-device proof still required.

What changed:
- Save Person/Garment row sync failures now explicitly say the item was not saved to Supabase.

Remaining blocker:
- The live Supabase schema still needs `ai/supabase/stabilization_patch.sql` applied.
- The phone still must prove Save Person and Save Garment create rows and storage objects.
## 2026-05-11T15:32 - Save Look Failure Wording Improved, Persistence Proof Still Blocked

Status: app-side failure visibility improved, physical-device proof still required.

What changed:
- Save Look row sync failures now explicitly say the look was not saved to Supabase.

Remaining blocker:
- The live Supabase schema still needs `ai/supabase/stabilization_patch.sql` applied.
- The phone still must prove Save Look creates `saved_looks` rows and reloads after restart/navigation.
## 2026-05-11T15:35 - Reload Fallback Improved, Persistence Proof Still Blocked

Status: reload display fallback improved, physical-device proof still required.

What changed:
- `storage_path` reloads now derive a public asset URL when `image_url` is missing.

Remaining blocker:
- The live Supabase schema still needs `ai/supabase/stabilization_patch.sql` applied.
- The phone still must prove saved person images and wardrobe items reload after restart/navigation.
- Product-ingestion and advanced fit/recommendation phases remain queued until stabilization and wardrobe/product-ingestion pass completion audits.
## 2026-05-11T15:40 - Saved Look Thumbnail Fallback Improved, Persistence Proof Still Blocked

Status: gallery image fallback improved, physical-device proof still required.

What changed:
- Saved Look thumbnails now use the backend private-bucket proxy when durable result storage exists.

Remaining blocker:
- The live Supabase schema still needs `ai/supabase/stabilization_patch.sql` applied.
- The phone still must prove Saved Looks persist, reload, and render gallery thumbnails after restart/navigation.
- Product-ingestion and advanced fit/recommendation phases remain queued until stabilization and wardrobe/product-ingestion pass completion audits.
## 2026-05-11T15:44 - Rename Failure Wording Improved, Persistence Proof Still Blocked

Status: app-side failure visibility improved, physical-device proof still required.

What changed:
- Saved-look rename failures now explicitly say the rename was not saved to Supabase.

Remaining blocker:
- The live Supabase schema still needs `ai/supabase/stabilization_patch.sql` applied.
- The phone still must prove Saved Looks can be renamed, persisted, reloaded, and shown in the gallery after restart/navigation.
- Product-ingestion and advanced fit/recommendation phases remain queued until stabilization and wardrobe/product-ingestion pass completion audits.
## 2026-05-11T15:48 - Closet Edit/Delete Failure Wording Improved, Persistence Proof Still Blocked

Status: app-side failure visibility improved, physical-device proof still required.

What changed:
- Person image and wardrobe edit/delete failures now explicitly report that Supabase was not updated.

Remaining blocker:
- The live Supabase schema still needs `ai/supabase/stabilization_patch.sql` applied.
- The phone still must prove person and wardrobe edits/deletes persist across restart/navigation and match Supabase rows.
- Product-ingestion and advanced fit/recommendation phases remain queued until stabilization and wardrobe/product-ingestion pass completion audits.
## 2026-05-11T15:51 - Saved Look Delete Failure Wording Improved, Persistence Proof Still Blocked

Status: app-side failure visibility improved, physical-device proof still required.

What changed:
- Saved Look delete failures now explicitly report that Supabase was not updated.

Remaining blocker:
- The live Supabase schema still needs `ai/supabase/stabilization_patch.sql` applied.
- The phone still must prove Saved Look deletes persist across restart/navigation and match Supabase rows.
- Product-ingestion and advanced fit/recommendation phases remain queued until stabilization and wardrobe/product-ingestion pass completion audits.
## 2026-05-11T15:55 - Saved Look Delete Local Ordering Fixed, Persistence Proof Still Blocked

Status: local failure consistency improved, physical-device proof still required.

What changed:
- Saved Look delete no longer writes the local Saved Looks list before the Supabase delete succeeds.

Remaining blocker:
- The live Supabase schema still needs `ai/supabase/stabilization_patch.sql` applied.
- The phone still must prove Saved Look deletes persist across restart/navigation and match Supabase rows.
- Product-ingestion and advanced fit/recommendation phases remain queued until stabilization and wardrobe/product-ingestion pass completion audits.
## 2026-05-11T15:59 - Auth Recovery Improved, Phone Proof Still Required

Status: app-side auth recovery improved, physical-device proof still required.

What changed:
- The auth screen now includes `Check session` to recover an existing Supabase session after manually returning from email verification.

Remaining blocker:
- The phone still must prove email verification recovery using automatic redirect, `Check session`, or pasted callback URL.
- The live Supabase schema still needs `ai/supabase/stabilization_patch.sql` applied.
- Product-ingestion and advanced fit/recommendation phases remain queued until stabilization and wardrobe/product-ingestion pass completion audits.
## 2026-05-11T16:02 - Auth Recovery Documented, Phone Proof Still Required

Status: auth recovery docs and busy state improved, physical-device proof still required.

What changed:
- `Check session` remains busy through profile creation.
- README/manual checklist now calls out `Check session` as an email verification recovery path.

Remaining blocker:
- The phone still must prove email verification recovery using automatic redirect, `Check session`, or pasted callback URL.
- The live Supabase schema still needs `ai/supabase/stabilization_patch.sql` applied.
- Product-ingestion and advanced fit/recommendation phases remain queued until stabilization and wardrobe/product-ingestion pass completion audits.
## 2026-05-11T16:06 - Avatar Status Improved, Phone Proof Still Required

Status: avatar proof visibility improved, physical-device proof still required.

What changed:
- Saving the avatar profile no longer hides whether the real GLB is loaded.

Remaining blocker:
- The phone still must prove the Avatar header reports `GLB` after load/save, gestures work, and controls do not overlap.
- If the header reports `Fallback`, record the visible fallback detail.
- The live Supabase schema still needs `ai/supabase/stabilization_patch.sql` applied.
## 2026-05-11T16:09 - Restore Callback Busy State Improved, Phone Proof Still Required

Status: auth recovery behavior improved, physical-device proof still required.

What changed:
- `Restore callback` remains busy through profile creation.

Remaining blocker:
- The phone still must prove email verification recovery using automatic redirect, `Check session`, or pasted callback URL.
- The live Supabase schema still needs `ai/supabase/stabilization_patch.sql` applied.
- Product-ingestion and advanced fit/recommendation phases remain queued until stabilization and wardrobe/product-ingestion pass completion audits.
## 2026-05-11T16:13 - Sign-In Profile Gate Improved, Phone Proof Still Required

Status: auth/profile readiness improved, physical-device proof still required.

What changed:
- Normal sign-in/sign-up now waits for profile creation and blocks app entry on profile failure.

Remaining blocker:
- The phone still must prove sign-in, session restore, sign-out, and email verification recovery.
- The live Supabase schema still needs `ai/supabase/stabilization_patch.sql` applied.
- Product-ingestion and advanced fit/recommendation phases remain queued until stabilization and wardrobe/product-ingestion pass completion audits.
## 2026-05-11T16:15 - Auth State Listener Profile Gate Improved, Phone Proof Still Required

Status: auth/profile readiness improved, physical-device proof still required.

What changed:
- Supabase auth-state changes no longer enter the workspace before profile readiness is confirmed.

Remaining blocker:
- The phone still must prove sign-in, session restore, sign-out, and email verification recovery.
- The live Supabase schema still needs `ai/supabase/stabilization_patch.sql` applied.
- Product-ingestion and advanced fit/recommendation phases remain queued until stabilization and wardrobe/product-ingestion pass completion audits.
## 2026-05-11T16:18 - Startup And Callback Profile Gates Improved, Phone Proof Still Required

Status: auth/profile readiness improved, physical-device proof still required.

What changed:
- Startup session restore and incoming auth callbacks now use profile-backed sessions.

Remaining blocker:
- The phone still must prove sign-in, session restore, sign-out, and email verification recovery.
- The live Supabase schema still needs `ai/supabase/stabilization_patch.sql` applied.
- Product-ingestion and advanced fit/recommendation phases remain queued until stabilization and wardrobe/product-ingestion pass completion audits.
## 2026-05-11T16:21 - Avatar Profile Failure Wording Improved, Phone Proof Still Required

Status: avatar persistence failure visibility improved, physical-device proof still required.

What changed:
- Avatar profile Supabase failures now explicitly report that Supabase was not updated.

Remaining blocker:
- The phone still must prove avatar profile saves to Supabase and reloads after restart/navigation.
- The phone still must prove Avatar reports `GLB` or `Saved | GLB`.
- The live Supabase schema still needs `ai/supabase/stabilization_patch.sql` applied.
## 2026-05-11T16:24 - Save Look Local Failure Persistence Improved, Phone Proof Still Required

Status: local fallback consistency improved, physical-device proof still required.

What changed:
- Save Look failure fallback now writes to local storage if try-on job Supabase sync fails before saved-look sync runs.

Remaining blocker:
- The phone still must prove Saved Looks persist locally and in Supabase across restart/navigation.
- The live Supabase schema still needs `ai/supabase/stabilization_patch.sql` applied.
- Product-ingestion and advanced fit/recommendation phases remain queued until stabilization and wardrobe/product-ingestion pass completion audits.
## 2026-05-11T16:26 - Saved Look Thumbnail Failure Visibility Improved, Phone Proof Still Required

Status: gallery failure visibility improved, physical-device proof still required.

What changed:
- Saved Looks gallery thumbnail failures now produce a visible message instead of silently showing a broken thumbnail.

Remaining blocker:
- The phone still must prove Saved Looks thumbnails render, and opening a look refreshes result images when needed.
- The live Supabase schema still needs `ai/supabase/stabilization_patch.sql` applied.
- Product-ingestion and advanced fit/recommendation phases remain queued until stabilization and wardrobe/product-ingestion pass completion audits.
## 2026-05-11T16:29 - Saved Look Open Proxy Fallback Improved, Phone Proof Still Required

Status: result-image fallback improved, physical-device proof still required.

What changed:
- Opening a Saved Look now uses the backend object proxy if signed URL refresh fails and durable storage exists.

Remaining blocker:
- The phone still must prove Saved Look open/refresh displays a nonblank result image after restart/navigation.
- The live Supabase schema still needs `ai/supabase/stabilization_patch.sql` applied.
- Product-ingestion and advanced fit/recommendation phases remain queued until stabilization and wardrobe/product-ingestion pass completion audits.
## 2026-05-11T16:32 - Saved Look Refresh Fallback Copy Improved, Phone Proof Still Required

Status: result-image fallback messaging improved, physical-device proof still required.

What changed:
- Saved Look open messages now name the actual fallback path: backend proxy, local backend, or no fallback.

Remaining blocker:
- The phone still must prove Saved Look open/refresh displays a nonblank result image after restart/navigation.
- The live Supabase schema still needs `ai/supabase/stabilization_patch.sql` applied.
- Product-ingestion and advanced fit/recommendation phases remain queued until stabilization and wardrobe/product-ingestion pass completion audits.
## 2026-05-11T16:35 - Local Fallback Reload Merge Improved, Phone Proof Still Required

Status: local fallback reload behavior improved, physical-device proof still required.

What changed:
- Reloads merge local fallback person images, wardrobe items, and Saved Looks with Supabase rows.

Remaining blocker:
- The phone still must prove failed Supabase saves remain visible after restart/navigation and that successful Supabase rows still load.
- The live Supabase schema still needs `ai/supabase/stabilization_patch.sql` applied.
- Product-ingestion and advanced fit/recommendation phases remain queued until stabilization and wardrobe/product-ingestion pass completion audits.
## 2026-05-11T16:38 - Save Look Double-Failure Visibility Improved, Phone Proof Still Required

Status: failure visibility improved, physical-device proof still required.

What changed:
- Save Look now reports if Supabase persistence fails and local fallback storage also fails.

Remaining blocker:
- The phone still must prove Save Look succeeds to Supabase after the schema patch and remains visible after restart/navigation.
- The live Supabase schema still needs `ai/supabase/stabilization_patch.sql` applied.
- Product-ingestion and advanced fit/recommendation phases remain queued until stabilization and wardrobe/product-ingestion pass completion audits.
## 2026-05-11T16:41 - Avatar Local-Newer Reload Preference Improved, Phone Proof Still Required

Status: avatar reload behavior improved, physical-device proof still required.

What changed:
- Avatar reload now keeps newer local measurements instead of replacing them with an older Supabase row.

Remaining blocker:
- The phone still must prove avatar profile saves to Supabase and reloads after restart/navigation.
- The phone still must prove Avatar reports `GLB` or `Saved | GLB`.
- The live Supabase schema still needs `ai/supabase/stabilization_patch.sql` applied.
## 2026-05-11T16:44 - Person And Wardrobe Delete Consistency Improved, Phone Proof Still Required

Status: delete failure consistency improved, physical-device proof still required.

What changed:
- Person image and wardrobe delete failures now restore the local item instead of persisting a local deletion that Supabase rejected.

Remaining blocker:
- The phone still must prove person and wardrobe deletes persist to Supabase and remain deleted after restart/navigation.
- The live Supabase schema still needs `ai/supabase/stabilization_patch.sql` applied.
- Product-ingestion and advanced fit/recommendation phases remain queued until stabilization and wardrobe/product-ingestion pass completion audits.
