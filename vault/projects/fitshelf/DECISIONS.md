# FitShelf Decisions

Document major decisions here.

Format:

```md
## YYYY-MM-DD HH:MM - Decision Title

Decision:
...

Reasoning:
...

Tradeoffs:
...

Impact:
...

## 2026-05-10 19:13 - Treat AI CLI Milestone As Active Session Scope

Decision:
Use `GOAL.md`, `STATUS.md`, and `TICKETS.md` as the active execution source for this session, with the local AI try-on CLI milestone first.

Reasoning:
`PLAN.md` records a previous Expo MVP phase as complete, while the current goal file explicitly names the local command `python ai/scripts/run_tryon.py --person ai/samples/person.jpg --garment ai/samples/garment.jpg --category upper --out ai/outputs/result.jpg` as the first critical milestone.

Tradeoffs:
This preserves the locked specs without rewriting the contradictory plan history. Phase labels remain imperfect until an operator-approved plan reconciliation is performed.

Impact:
Implemented the `ai/` pipeline, tests, backend surface, queue-compatible worker, Supabase schema draft, and product image extraction utility inline in this Codex session.

## 2026-05-10 19:43 - Use Isolated Windows CatVTON Environment

Decision:
Install CatVTON into `ai/.venv-catvton` with Python 3.9 and call it from FitShelf through `FITSHELF_CATVTON_COMMAND`.

Reasoning:
The active app Python is 3.14, while CatVTON's pinned Torch/Diffusers stack is Python 3.9-era and should not be mixed into the app/test environment.

Tradeoffs:
The CatVTON environment and downloaded model weights are large and are intentionally ignored by git. The Windows requirements overlay differs from the upstream file only where upstream pins were not installable or conflicted in this environment.

Impact:
FitShelf now runs real CatVTON when `FITSHELF_CATVTON_COMMAND` points at `ai/.venv-catvton/Scripts/python.exe ai/scripts/run_catvton.py --person {person} --garment {garment} --category {category} --out {out}`.

## 2026-05-10 20:06 - Keep Local API Synchronous With Job Status Records

Decision:
Keep `/tryon` synchronous for local development, but record every submission in an in-memory job registry and expose `GET /jobs/{job_id}`.

Reasoning:
CatVTON local smoke inference is slow enough to need visible status, but adding Redis/RQ now would introduce another service dependency before the local app flow is proven.

Tradeoffs:
Jobs are lost when the FastAPI process restarts. This is acceptable for the local API/app flow and leaves a clean seam for Redis/RQ later.

Impact:
The Expo app can submit a try-on, display the completed job payload, show `backend=catvton-external`, and render the generated result URL.

## 2026-05-10T23:56 - Backend App Env Files Are Source Of Truth

Decision:
Load backend settings from root `.env` and then `ai/backend/.env`, with app env files taking priority over shell variables and `ai/backend/.env` taking priority over root `.env`.

Reasoning:
The operator wants repeatable app startup without pasting shell variables, and app-local env files should define backend behavior.

Tradeoffs:
Ad hoc shell overrides no longer change backend behavior when a configured app env file is present. Controlled CatVTON experiments should use direct CLI flags or edit `ai/backend/.env`.

Impact:
`.\ai\scripts\start_backend.ps1` starts with the same CatVTON settings every time from `C:\Users\benwe\Projects\OneShot`.

## 2026-05-10T23:56 - Treat 1-Step CatVTON As Smoke Only

Decision:
Use `CATVTON_STEPS=8` or higher for visual checks and keep the backend quality default at `CATVTON_STEPS=50`, `CATVTON_WIDTH=768`, `CATVTON_HEIGHT=1024`, `CATVTON_MIXED_PRECISION=no`.

Reasoning:
Controlled outputs showed 1-step inference creates corrupted/noisy images, while 8-step outputs are coherent at both `fp16` and no mixed precision.

Tradeoffs:
Quality runs are slower than 1-step smoke runs.

Impact:
The backend env example, local backend `.env`, and CatVTON docs now point away from the corrupt smoke setting for real app use.

## 2026-05-11T00:36 - Add Explicit Preview And HD Render Modes

Decision:
Productize CatVTON through two backend render modes: `preview` (`384x512`, 8 steps, `fp16`) and `hd` (`768x1024`, 50 steps, no mixed precision).

Reasoning:
The previous 1-step smoke path proved connectivity but produced corrupted output. Preview gives a faster coherent result, while HD preserves the quality-oriented settings.

Tradeoffs:
The backend still runs synchronously for local development, so HD can block the request for several minutes.

Impact:
The app can render previews, save them locally, and rerender a saved/current preview in HD without replacing CatVTON.

## 2026-05-11T00:36 - Use React Three Fiber Native For Avatar Foundation

Decision:
Use `@react-three/fiber/native` with Expo GL and Three.js for the 3D avatar section.

Reasoning:
It is Expo-compatible, typechecks cleanly, and avoids the high-severity old transitive dependencies introduced by `expo-three`.

Tradeoffs:
The current section renders a procedural mannequin and stores a placeholder `.glb` asset for the future loader path. It is not a production avatar model or garment simulation.

Impact:
FitShelf now has a 3D avatar foundation with rotate/zoom controls and local measurement persistence while CatVTON remains the 2D try-on renderer.

## 2026-05-11T01:22 - Keep Supabase Secrets Backend-Only

Decision:
Expo uses only `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY`; FastAPI uses `SUPABASE_SERVICE_ROLE_KEY` only from `ai/backend/.env`.

Reasoning:
Storage uploads for generated CatVTON results need elevated backend credentials, while the mobile app must never receive the service-role key.

Tradeoffs:
The backend must mediate result uploads and provide signed/public URLs in job payloads.

Impact:
The API returns Supabase result URLs when backend upload succeeds and keeps local result URLs as fallback.

## 2026-05-11T01:22 - Raise Preview To 20 Steps

Decision:
Increase Preview mode from 8 steps to 20 steps while keeping HD at 50 steps.

Reasoning:
8 steps was coherent, but the product loop benefits from a higher-quality preview without making every interaction as slow as HD.

Tradeoffs:
Preview is slower than the prior 8-step mode.

Impact:
Backend health, tests, docs, and app labels now treat Preview as `384x512`, 20 steps, `fp16`.

## 2026-05-11T01:34 - Add Backend Supabase Health Check

Decision:
Expose `GET /supabase/health` for backend-only Supabase Storage verification.

Reasoning:
The private `tryon-results` bucket requires service-role credentials and signed URL creation, so the backend needs a safe smoke check that does not expose secrets to Expo or logs.

Tradeoffs:
The endpoint uploads a small probe object to the configured bucket.

Impact:
Operators can verify URL/key loading, bucket existence, upload, and signed URL creation before running phone try-ons.

## 2026-05-11T01:34 - Local-First App Persistence

Decision:
Keep Saved Looks and Avatar profile writes local-first, then attempt Supabase sync when authenticated/configured.

Reasoning:
The product loop should not lose generated looks or measurements because of RLS, connectivity, signed-out state, or transient Supabase failures.

Tradeoffs:
The app may temporarily show local data that has not synced to Supabase.

Impact:
Sync failures produce useful messages while local state remains intact.
## 2026-05-11T02:17 - Persist Storage Paths Instead Of Signed URLs Alone

Decision:
- Treat Supabase signed URLs as temporary display URLs only.
- Persist `supabase_storage_path`/`resultStoragePath` and `local_result_url`/`localResultUrl` with each Saved Look.
- Add a backend `/supabase/sign` endpoint so the app can request a fresh signed URL without exposing the service-role key.

Reason:
- Private Supabase buckets are correct for generated try-on results, but signed URLs expire and should not be the only durable Saved Look reference.
- The Expo app can safely use the anon key for user data while the backend keeps Storage signing behind the service-role key.

## 2026-05-11T02:17 - Use R3F Native With Procedural Avatar Fallback

Decision:
- Use `@react-three/fiber/native` and `@react-three/drei/native` for the avatar viewer.
- Keep a default `.glb` mannequin asset, but render a procedural mannequin fallback inside the same canvas if GLB loading fails.
- Use approximate scaling for measurements because the default GLB has no rig or morph targets.

Reason:
- This follows the official React Three Fiber React Native setup and keeps Expo Go compatibility as high as practical.
- A fallback avoids a blank avatar screen on devices with GLB/OpenGL loader issues.
## 2026-05-11T03:00 - Align App Persistence To Supabase Schema

Decision:
- Stop writing app data to non-schema tables such as `mannequins`, `clothing_items`, and `outfits`.
- Use `person_images` for reusable person/body images and `wardrobe_items` for garments.
- Generate UUIDs for new person and wardrobe rows.
- Keep outfits local for now because the current schema does not define an `outfits` table.

Reason:
- The observed empty Supabase tables were consistent with schema/table mismatch, UUID column mismatch, and local fallback hiding write errors.

## 2026-05-11T03:00 - Add Backend Private Object Proxy

Decision:
- Keep signed URLs as the primary private bucket display path.
- Add `/supabase/object?storage_path=...` as a backend proxy fallback when React Native cannot display a signed URL directly.

Reason:
- Direct browser testing showed the signed URL path shape mattered. The proxy gives the app a stable backend URL while preserving private bucket storage and keeping the service-role key backend-only.

## 2026-05-11T03:00 - Keep CatV2TON Optional And Disabled

Decision:
- Clone and document CatV2TON.
- Add backend config and a check-capable runner stub.
- Do not enable CatV2TON inference by default.

Reason:
- The official CatV2TON repo is not a drop-in replacement for the current CatVTON single-image command. It expects dataset layout and generated condition assets, so enabling it without a purpose-built adapter would break the working product loop.
## 2026-05-11T10:50 - Test Priority Tables From The App Session

Decision:
- Keep the app-side `Test DB Write` action focused on `profiles`, `avatar_profiles`, and `saved_looks`.
- The test uses the publishable anon key and current Supabase session, not backend service-role access.

Reason:
- Backend DB health proves credentials/schema reachability, but the priority failure mode is RLS/user-session writes from Expo.

## 2026-05-11T10:50 - Proxy After Repeated Signed Image Failure

Decision:
- Refresh signed URLs on first image failure.
- If the same `supabase_storage_path` fails again from a signed URL source, switch to the backend private-object proxy.

Reason:
- This avoids repeatedly loading a URL shape React Native may reject while keeping private bucket access backend-mediated.

## 2026-05-11T10:50 - Resolve GLB With Expo Asset Before Drei Loading

Decision:
- Download/resolve the bundled GLB with `expo-asset`, then pass the resolved URI to `@react-three/drei/native` `useGLTF`.

Reason:
- Passing the raw module value is less reliable across Expo/React Native runtimes. Resolving the asset first keeps the GLB path primary and the fallback emergency-only.
## 2026-05-11T11:13 - Use Expo Linking For Supabase Email Redirects

Decision:
- Use `expo-linking` to generate the active Expo redirect URL for `auth/callback`.
- Pass that value as `emailRedirectTo` during Supabase signup.
- Handle callbacks in the app for both `code=...` and `#access_token=...&refresh_token=...`.
- Keep `fitshelf://auth/callback` as the eventual production redirect scheme.

Reason:
- Supabase was falling back to `http://localhost:3000`, which is not a valid phone app callback. Expo development URLs vary by LAN/tunnel/port, so the app should display and use the exact generated redirect URL.
## 2026-05-11T11:59 - Make Persistence Explicit At The User Action Level

Decision:
- Keep `tryon_jobs` recording automatic after render completion.
- Make `person_images`, `wardrobe_items`, and `saved_looks` visible user actions through `Save Person`, `Save Garment`, and `Save Look`.
- Expand the app-side DB debug action to cover all priority persistence tables, not only saved looks and avatar profiles.

Reason:
- The broken phone flow was partly a discoverability and proof problem: uploads could be selected or auto-saved without a clear operator action that maps to a Supabase row.
- `tryon_jobs` is event telemetry for a render and should be recorded when the render returns, while saved looks should be an explicit product action.

## 2026-05-11T11:59 - Use Touch Gestures For Avatar View Controls

Decision:
- Replace avatar rotate/zoom buttons with drag rotation and pinch zoom around the R3F viewer.
- Keep the GLB as the primary model and retain the non-capsule procedural fallback only for asset/model load failure.
- Tell the operator that the current GLB does not support rigged body morphs, so measurement controls are approximate.

Reason:
- The phone feedback called out the button layout as poor and asked for touch rotate/pinch.
- Unsupported morph sliders should not imply real rigged deformation when the asset has no rig or morph targets.
## 2026-05-11T12:08 - Do Not Sync Broken Local Asset Paths To Cloud Rows

Decision:
- Only write `person_images` and `wardrobe_items` rows for items with a real Supabase Storage path.
- Keep failed asset uploads local and preserve the sanitized storage error in the visible sync UI.
- Add the required `fitshelf-assets` bucket and user-prefix storage policy to the schema.

Reason:
- A Supabase row pointing at a device-local URI does not survive restart/navigation on another device and makes persistence look successful when storage actually failed.

Impact:
- Save Person and Save Garment now either produce a cloud row backed by Storage, or clearly remain local with an error explaining why cloud sync did not happen.

## 2026-05-11T12:08 - Treat Load Failures As Sync Errors

Decision:
- When signed in, table load errors for the core persisted data throw sanitized table-specific messages and are shown in the UI.

Reason:
- Falling back to AsyncStorage on a failed signed-in read can hide RLS/schema failures and make stale local data look like successful Supabase reload.
## 2026-05-11T12:14 - Do Not Show Procedural Avatar During Normal GLB Load

Decision:
- Regenerate the bundled mannequin as a smoother GLB asset without `CapsuleGeometry`.
- Keep the procedural avatar only for hard GLB load failure.
- During normal GLB load, show a loading overlay rather than substituting the procedural avatar.

Reason:
- The phone result specifically reported that the avatar still looked geometric/procedural. Rendering the fallback while the GLB loads makes that failure mode ambiguous and can hide real GLB loading problems.
## 2026-05-11T12:19 - Add App-Side Storage Policy Debug Check

Decision:
- Add `Test Asset Upload` beside the existing Supabase/DB debug actions.
- The check uploads and deletes a harmless object in `fitshelf-assets` under the signed-in `user_id` prefix.

Reason:
- `Test DB Write` proves table RLS, but Save Person and Save Garment also depend on Supabase Storage object policies. A separate app-side storage check isolates that failure mode before using real photos.
## 2026-05-11T12:23 - Prefer Proxy After Signed Image Failure

Decision:
- Keep signed URLs as the primary display path and storage paths as the durable source of truth.
- If React Native fails to load a signed image URL, switch to the backend private-object proxy when a storage path exists.
- Use the local backend result URL as the next fallback.

Reason:
- Re-refreshing a signed URL after React Native already failed to display that path can leave the result area blank again. The proxy gives the app a different URL shape while preserving private-bucket access through the backend.
## 2026-05-11T12:26 - Label Legacy Outfit Builder As Local Manual Drafts

Decision:
- Rename the legacy `outfits` tab to `manual`.
- Label its saved composites as local manual drafts.
- Keep Supabase-backed generated-result persistence focused on Try-On Saved Looks.

Reason:
- The physical-device report called the Outfits screen stale/incorrect. During stabilization, introducing a new cloud `outfits` table would broaden scope beyond the priority persistence tables. Clear labeling prevents the local manual builder from being mistaken for the Supabase-backed Saved Looks flow.
## 2026-05-11T12:29 - Make Backend DB Health Cover Priority Tables

Decision:
- Expand `/supabase/db-health` to check every priority persistence table and key current columns.
- Add `ai/supabase/stabilization_patch.sql` for existing projects that need only the latest stabilization schema changes.

Reason:
- A profile-only backend DB check can pass while app persistence still fails on missing columns or tables. The stronger health check surfaced the live missing `person_images.image_url` column immediately.
## 2026-05-11T12:35 - Keep Debug Checks Non-Destructive

Decision:
- Cleanup transient rows after backend and app DB debug checks, including failure paths.
- Preserve and restore the user's existing `avatar_profiles` row during app-side `Test DB Write`.

Reason:
- Debug actions should expose schema/RLS failures without polluting user tables or overwriting real avatar measurements.
## 2026-05-11T12:38 - Add Read-Only Schema Health Before Write Health

Decision:
- Add `/supabase/schema-health` as a read-only required-table/column check.
- Keep `/supabase/db-health` as the stronger write/read/delete health check.

Reason:
- A read-only check provides a fast, low-risk way to verify that the latest schema patch is applied before running write checks or phone flows.
## 2026-05-11T12:46 - Surface Backend Schema Health In The App

Decision:
- Add `Test Backend Schema` to the Try-On panel near the backend URL field.

Reason:
- The phone needs to use a LAN/hotspot backend URL, so surfacing `/supabase/schema-health` in the same panel verifies both backend reachability and schema readiness before rendering or saving.
## 2026-05-11T12:50 - Reload PostgREST Schema Cache In SQL Patch

Decision:
- End the stabilization patch and full schema with `notify pgrst, 'reload schema';`.

Reason:
- The live failure is surfaced through PostgREST schema-cache errors. Reloading the schema cache after DDL avoids a false failure after the columns are added.
## 2026-05-11T12:53 - Return Patch File From Schema Health

Decision:
- Include `patch_file` in `/supabase/schema-health` responses and in the app error message.

Reason:
- The remaining blocker is manual SQL application. Returning the exact patch file path reduces operator ambiguity and helps avoid applying stale SQL.
## 2026-05-11T13:00 - Gate Saves After Failed Schema Check

Decision:
- Treat a failed in-app backend schema check as a hard blocker for Try-On save actions.
- Reset the gate when the backend URL changes so the operator can test a different backend without restarting the app.

Reason:
- The live Supabase schema is currently known to reject priority persistence writes. Once the phone has confirmed that failure, continuing to expose save actions creates predictable write errors and confusing partial state.
## 2026-05-11T13:05 - Keep Remaining Work At Verification Boundary

Decision:
- Do not add new feature scope while live schema application and phone verification are still open.
- Add only small operator-facing stabilization hints around the existing schema gate.

Reason:
- The current failure is not missing app feature code; it is an external schema/application gate plus real-device proof. More broad implementation before that gate would reduce confidence and make the next phone run harder to interpret.
## 2026-05-11T13:11 - Await Explicit Asset Saves In Try-On

Decision:
- Make Try-On await Save Person and Save Garment callbacks and show local progress/completion/failure.

Reason:
- The next manual phone run needs direct feedback in the same panel where the operator taps save. Header sync status remains useful, but the save control should not appear fire-and-forget while Supabase persistence is being verified.
## 2026-05-11T13:15 - Return Save Sync Messages To Caller

Decision:
- Have the parent Save Person/Garment handlers return their final sync message to Try-On.

Reason:
- Returning the same message shown in the sync panel avoids split-brain diagnostics during the phone run. If Storage or table sync fails, the operator sees the failure both globally and next to the action they just tapped.
## 2026-05-11T13:19 - Add Patch Hint To App-Side Schema Errors

Decision:
- Append the stabilization patch instruction to app-side Supabase errors that look like missing-column or PostgREST schema-cache failures.

Reason:
- The current live failure is a known schema patch gap. If the tester hits `Test DB Write` before `Test Backend Schema`, the app should still name the exact patch instead of requiring backend-log interpretation.
## 2026-05-11T13:23 - Do Not Label Local-Only Asset Saves As Cloud Saves

Decision:
- Treat a missing Supabase storage path as local-only in the Save Person/Garment success message.

Reason:
- The persistence objective requires rows to actually appear in Supabase. A generic `saved` message after local fallback makes the phone run ambiguous, especially when the user is signed out or Storage policy is missing.
## 2026-05-11T13:26 - Put Phone Gates In Setup Docs

Decision:
- Add the exact current backend and phone persistence gates to `fitshelf-app/README.md` and `ai/supabase/README.md`.

Reason:
- The remaining work is a manual verification boundary. Keeping the ordered gates in docs reduces the chance of testing Save Person/Garment before schema and DB health are actually ready.
## 2026-05-11T13:31 - Surface Backend DB Health In Try-On

Decision:
- Add `Test Backend DB` to the Try-On panel instead of requiring a separate curl/browser request for `/supabase/db-health`.

Reason:
- The required manual gate is `priority_tables_ok=true`. Showing it on the same phone screen as `Test Backend Schema` keeps the tester from proceeding to Save Person/Garment while backend service-role table health is still failing.
## 2026-05-11T13:35 - Cover Backend DB Failure Shape

Decision:
- Add a regression test for the `/supabase/db-health` failure response used by `Test Backend DB`.

Reason:
- The phone UI depends on `priority_tables_ok=false` and the error message to block saves and guide the operator. That failure shape is as important as the success shape during the current stabilization blocker.
## 2026-05-11T13:39 - Include Patch Metadata In DB Health

Decision:
- Return `patch_file` from `/supabase/db-health`, matching `/supabase/schema-health`.

Reason:
- DB health is now a first-class phone gate. It should carry the same remediation metadata as schema health so the UI does not need to hardcode the fix path.
## 2026-05-11T13:42 - Keep DB Health Docs In Sync

Decision:
- Document `patch_file` in the expected `/supabase/db-health` JSON.

Reason:
- The manual setup docs should match the actual backend response shape used by the phone gate.
## 2026-05-11T13:46 - Add Static Avatar Contract Test

Decision:
- Add a static regression test for the avatar implementation contract.

Reason:
- The physical device report called out procedural avatar fallback, poor controls, and missing numeric measurement inputs. A static test cannot prove device rendering, but it prevents accidental removal of the GLB path, touch gestures, numeric inputs, and unsupported morph disclosure.
## 2026-05-11T13:50 - Add Static Try-On Contract Test

Decision:
- Add a static regression test for the Try-On persistence and result-image contract.

Reason:
- The manual phone run depends on specific controls and fallback hooks remaining present. Static coverage cannot prove the phone flow, but it prevents accidental removal of the visible save actions, backend gates, storage-path recovery, proxy fallback, and image reload behavior.
## 2026-05-11T13:53 - Add Static App Supabase Contract Test

Decision:
- Add a static regression test for app-side Supabase persistence, auth callback, debug actions, and service-role separation.

Reason:
- The core phone flow depends on exact UI/debug affordances and auth/session recovery hooks. Static coverage does not replace phone testing, but it prevents accidental removal of the code paths required to perform that test.
## 2026-05-11T14:00 - Add Static Supabase Patch Contract Test

Decision:
- Add a static regression test for `ai/supabase/stabilization_patch.sql`.

Reason:
- The live blocker depends on manually applying that exact patch file. Static coverage cannot apply it to Supabase, but it prevents accidental removal of the columns, buckets, storage policy, auth path restriction, or PostgREST reload instruction needed for the manual repair.
## 2026-05-11T14:04 - Explicitly Scope Supabase Reload Reads

Decision:
- Add `.eq("user_id", ...)` to Supabase reload queries for `person_images`, `wardrobe_items`, and `saved_looks`.

Reason:
- RLS should isolate rows, but the persistence objective requires unambiguous per-user reload behavior after restart. Explicit filters make the app contract clearer and easier to verify on the phone.
## 2026-05-11T14:09 - Add Manual Auth Callback Recovery

Decision:
- Add a paste-and-restore callback URL action to the auth screen.

Reason:
- The physical phone report says email redirect does not reopen the app automatically. The app already handles deep links, but the tester needs a fallback when the OS/browser fails to hand the callback URL to Expo.
## 2026-05-11T14:13 - Scope DB Debug Reads And Deletes By User

Decision:
- Add authenticated `user_id` filters to `Test DB Write` read/delete/cleanup checks.

Reason:
- The debug action should prove the signed-in user's row ownership, not just table reachability by id. This makes the phone persistence gate better aligned with the requirement that every row belongs to the correct user.
## 2026-05-11T14:17 - Scope Backend DB Health Rows By User

Decision:
- Add synthetic `user_id` filters to backend `/supabase/db-health` read/delete/cleanup checks.

Reason:
- The backend phone gate should validate the same ownership contract as the app-side DB debug action. A green DB-health result should mean the priority tables are writable and readable for the intended user id, not just reachable by primary key.
## 2026-05-11T14:20 - Guard Bundled Avatar As GLB

Decision:
- Add static coverage for the bundled `default-mannequin.glb` file.

Reason:
- The physical report says the avatar still looked procedural. Static tests cannot prove device rendering, but they should at least guard that the primary avatar path points at a real GLB asset rather than an empty, missing, or wrong-format file.
## 2026-05-11T14:23 - Guard GLB Geometry Bounds

Decision:
- Extend the bundled avatar asset test to parse GLB metadata and verify finite position accessor bounds.

Reason:
- The avatar requirement explicitly calls out NaN geometry. This does not replace phone rendering proof, but it prevents shipping a bundled model whose declared geometry bounds contain non-finite values.
## 2026-05-11T14:27 - Guard Expo GLB Runtime Config

Decision:
- Add static coverage for the Expo/R3F/Metro configuration needed for GLB avatar loading.

Reason:
- A valid GLB file is not enough if Expo cannot package or load it. This guards the dependency and bundler setup required before the physical phone rendering check.
## 2026-05-11T14:30 - Guard Production Save User Ownership

Decision:
- Add static coverage for `user_id` payloads in production Supabase save functions.

Reason:
- The persistence objective requires every insert to belong to the correct user. The save paths already include `user_id`; the test now prevents accidental regression before the physical phone proof.
## 2026-05-11T14:33 - Guard Saved Look Recovery Fields

Decision:
- Add static coverage for durable saved-look result fields in `saveSavedLooks`.

Reason:
- Result image reliability depends on preserving the permanent storage path, local fallback URL, and try-on job link. These fields must not regress while the live phone proof is pending.
## 2026-05-11T14:37 - Guard Manual Drafts Separation

Decision:
- Add static coverage that separates local manual drafts from Supabase-backed Try-On Saved Looks.

Reason:
- The physical report called the outfits screen stale/incorrect. The app should not imply the manual builder is the generated-result persistence surface; generated results belong in Try-On Saved Looks.
## 2026-05-11T14:40 - Guard Supabase Success Messages

Decision:
- Add static coverage that Save Person/Garment only claim Supabase persistence when `uploaded.storagePath` exists.

Reason:
- The phone run must distinguish local fallback from real cloud persistence. A misleading success message would make the manual verification ambiguous.
## 2026-05-11T14:44 - Guard Signed URL Proxy Response

Decision:
- Add backend test coverage for `supabase_proxy_url` in `/supabase/sign`.

Reason:
- The result-image recovery path depends on a backend proxy when React Native cannot render the signed Supabase URL directly. The backend response should keep exposing that fallback URL.
## 2026-05-11T14:48 - Encode Proxy Storage Paths

Decision:
- Percent-encode `storage_path` in backend-generated `supabase_proxy_url`.

Reason:
- Storage paths can contain reserved URL characters. Encoding prevents the proxy fallback URL from becoming invalid before React Native tries to load it.
## 2026-05-11T14:52 - Add Patch Hint To Storage Errors

Decision:
- Add the stabilization patch hint to app storage-layer schema-cache and missing-column errors.

Reason:
- The user sees Save Person/Garment/Saved Look errors through storage helpers, not only through debug buttons. Those errors should point at the same manual repair file as the backend gates.
## 2026-05-11T14:56 - Use ArrayBuffer For React Native Storage Uploads

Decision:
- Read local image files through Expo FileSystem as base64 and upload an ArrayBuffer to Supabase Storage.

Reason:
- Supabase Storage's own React Native guidance says Blob/File/FormData uploads do not work as intended. The physical phone report says person/garment uploads did not persist, so the upload body type should match the supported React Native path.
## 2026-05-11T14:59 - Use ArrayBuffer For Debug Asset Upload

Decision:
- Use ArrayBuffer for the `Test Asset Upload` debug action.

Reason:
- The debug action should test the same React Native-compatible Storage path as production uploads. Leaving it on Blob could produce a misleading failure on the phone.
## 2026-05-11T15:03 - Allowlist Upload Extensions

Decision:
- Restrict generated Supabase Storage object extensions to known image extensions and fall back to `jpg`.

Reason:
- Phone picker URIs can be extensionless or use non-file URI shapes. The upload path should not use an arbitrary URI segment as the object extension.
## 2026-05-11T15:07 - Guard Try-On Upload Metadata

Decision:
- Reuse allow-listed image extension inference for try-on `FormData` parts and fall back to `jpg` when picker URIs have no useful extension.

Reason:
- Phone image pickers can return `content://` or query-heavy URIs. Sending those through raw string splitting can produce invalid filenames or content types before the backend sees the upload.

Consequence:
- Render uploads use stable `jpg`, `jpeg`, `png`, or `webp` metadata only.
- The backend still receives the original URI payload from React Native `FormData`; this change only stabilizes metadata.
## 2026-05-11T15:11 - Use Bundled GLB Module In Native Loader

Decision:
- Feed the bundled `default-mannequin.glb` asset module directly into `useGLTF` on React Native.

Reason:
- `@react-three/fiber/native` patches Three's `FileLoader` to resolve Expo asset modules through `Asset.fromModule`. Passing a downloaded `file://` URI can bypass that stronger bundled-asset resolution path and cause device-only fallback.

Consequence:
- The Avatar screen still pre-downloads the GLB for readiness, but the actual GLTF loader uses the Metro asset module.
- The procedural avatar remains available only as a hard failure fallback.
## 2026-05-11T15:14 - Compact Avatar Measurement Grid

Decision:
- Render avatar measurement controls in a wrapping grid with stable minimum field widths.

Reason:
- A single-column measurement stack pushes most controls far below the viewer on phone screens, which matches the reported device feedback that only the first few controls visibly worked.

Consequence:
- More measurement controls are visible near the avatar while preserving the existing slider plus numeric-input behavior.
## 2026-05-11T15:18 - Defer Product URL Import UI

Decision:
- Hide Product URL import from the app while stabilization remains incomplete.

Reason:
- The current run requires the broken core flows to work on the real app before broad product workflow features are exposed.

Consequence:
- Closet focuses on core person/garment persistence and edit/delete/favorite behavior.
- Product URL ingestion can return after Supabase persistence, result images, GLB avatar, and auth recovery pass the physical-device audit.
## 2026-05-11T15:22 - Show Avatar Fallback Detail

Decision:
- Display a short sanitized GLB fallback diagnostic in the Avatar viewer.

Reason:
- The real device is still the authority for Expo GLB behavior. If it falls back, a visible failure string is needed to distinguish asset resolution, file read, parser, and render errors.

Consequence:
- The fallback remains available for hard GLB failure, but it now produces actionable evidence instead of a generic fallback label.
## 2026-05-11T15:25 - Fail Fast On Invalid GLB Bounds

Decision:
- Validate loaded GLB scene bounds before autoscaling the avatar.

Reason:
- Empty or non-finite bounds can produce invalid scale values and a blank-looking avatar viewer. A diagnosed fallback is more useful than silently applying a broken transform.

Consequence:
- Valid GLBs still center/autoscale normally.
- Invalid GLBs route through the existing fallback path with a visible error detail.
## 2026-05-11T15:29 - Explicit Cloud Save Failure Copy

Decision:
- Use direct Save Person/Garment failure messages when Supabase row sync fails.

Reason:
- `Local fallback active` was too easy to interpret as success. During stabilization, the phone tester needs to know whether the Supabase row actually exists.

Consequence:
- The app still keeps a local copy, but the UI now clearly distinguishes that from a successful Supabase save.
## 2026-05-11T15:32 - Explicit Save Look Failure Copy

Decision:
- Use direct Save Look failure messaging when Supabase saved-look sync fails.

Reason:
- Generated look persistence is one of the critical stabilization paths. The UI must not imply a Supabase save succeeded when only local state was kept.

Consequence:
- The app still keeps a local copy for recovery, but the phone tester can clearly tell that `saved_looks` persistence failed.
## 2026-05-11T15:35 - Derive Asset URLs On Reload

Decision:
- When reloading person images and wardrobe items, derive a public Supabase Storage URL from `storage_path` if `image_url` is absent.

Reason:
- Older or partially populated rows can have a valid storage path but no display URL. React Native cannot render a raw bucket path.

Consequence:
- Reloaded closet/person assets have a better chance of rendering after restart even before every existing row has `image_url` populated.
## 2026-05-11T15:40 - Use Proxy For Stored Look Thumbnails

Decision:
- Use the backend object proxy for Saved Look thumbnails when a durable result storage path exists and no local result URL is available.

Reason:
- Stored signed result URLs can expire. Gallery thumbnails should prefer a durable source derived from `resultStoragePath`.

Consequence:
- The Saved Looks gallery should be less likely to show broken thumbnails after restart/navigation.
## 2026-05-11T15:44 - Explicit Rename Failure Copy

Decision:
- Use direct rename failure messaging when a saved-look rename cannot be synced to Supabase.

Reason:
- Rename is part of saved-look persistence. The tester needs to know whether the new name is durable or only held locally.

Consequence:
- The app can keep the local name for continuity while clearly reporting that Supabase persistence failed.
## 2026-05-11T15:48 - Explicit Closet Edit/Delete Failure Copy

Decision:
- Use direct Supabase failure messaging for person image and wardrobe item edit/delete failures.

Reason:
- Closet edits and deletes are part of the reusable wardrobe persistence path. A local UI update must not look like a durable Supabase change.

Consequence:
- The app can keep local continuity after a failed write/delete while clearly telling the tester that Supabase did not persist the change.
## 2026-05-11T15:51 - Explicit Saved Look Delete Failure Copy

Decision:
- Use direct Supabase failure messaging for Saved Look delete failures.

Reason:
- Saved Look deletion is part of the generated-look persistence path. A generic delete error does not tell the tester whether local state or Supabase state changed.

Consequence:
- The app now clearly reports that the delete was not saved to Supabase and that the local list was kept.
## 2026-05-11T15:55 - Delete Saved Look Remotely Before Local Storage

Decision:
- For Saved Look delete, perform the Supabase delete before writing the local Saved Looks list.

Reason:
- If Supabase delete fails, the UI says the local list was kept. Writing local storage first made that statement untrue after restart.

Consequence:
- Failed Supabase deletes preserve the local Saved Looks list in both UI state and local persisted storage.
## 2026-05-11T15:59 - Add Manual Session Check On Auth Screen

Decision:
- Add a visible `Check session` action to the auth screen.

Reason:
- Email verification may not automatically reopen the app on all Expo/device setups. If the user manually returns to FitShelf, they need a direct way to check whether a Supabase session is available before pasting a callback URL.

Consequence:
- Auth recovery now has three visible paths: automatic link handling, manual session check, and pasted callback URL.
## 2026-05-11T16:02 - Keep Auth Recovery Busy Through Profile Creation

Decision:
- Keep the `Check session` action busy until profile creation/verification completes.

Reason:
- Entering the app before the profile path is known can confuse the manual auth recovery test and make duplicate taps more likely.

Consequence:
- The auth screen reports a single recovery result after both session lookup and profile readiness are checked.
## 2026-05-11T16:06 - Preserve Avatar Model Status After Save

Decision:
- Show saved state alongside the avatar model state instead of replacing the model state.

Reason:
- The physical phone check needs to confirm the viewer is using the real GLB. Hiding `GLB` behind `Saved` makes that proof ambiguous after avatar profile persistence succeeds.

Consequence:
- The header can show `Saved | GLB` or `Saved | Fallback`, keeping the proof signal visible.
## 2026-05-11T16:09 - Keep Restore Callback Busy Through Profile Creation

Decision:
- Keep the `Restore callback` action busy until profile creation/verification completes.

Reason:
- The pasted callback path should behave like `Check session`; both restore auth and must not look done before profile readiness is known.

Consequence:
- The auth screen now reports recovery results after the session and profile checks complete on both manual recovery paths.
## 2026-05-11T16:13 - Gate App Entry On Profile Readiness

Decision:
- Normal sign-in/sign-up must wait for `ensureSupabaseProfile()` and should not enter the app if profile creation fails.

Reason:
- The app's persistence layer relies on an authenticated user/profile path. Entering the app with profile creation failed can make later persistence failures look unrelated.

Consequence:
- All auth entry paths now require session and profile readiness before navigating into the workspace.
## 2026-05-11T16:15 - Gate Auth State Listener On Profile Readiness

Decision:
- The Supabase auth-state listener must wait for `ensureSupabaseProfile()` before setting the app session.

Reason:
- Auth events can fire independently of the explicit auth screen paths. If they enter the workspace early, they bypass the profile-readiness gate.

Consequence:
- Workspace entry is consistently gated on profile readiness for auth screen sign-in, manual recovery, callback recovery, and auth-state changes.
## 2026-05-11T16:18 - Gate Startup And Callback Sessions On Profile Readiness

Decision:
- Startup session restore and incoming auth callback handling must wait for `ensureSupabaseProfile()` before setting the app session.

Reason:
- These paths can enter the workspace independently of the auth screen and auth-state listener. They need the same profile-readiness gate so persistence always has a valid user/profile context.

Consequence:
- Session restore, incoming auth links, auth-state changes, auth screen sign-in, and manual recovery now all use profile-backed app sessions.
## 2026-05-11T16:21 - Explicit Avatar Profile Failure Copy

Decision:
- Use direct Supabase failure messaging for avatar profile save failures.

Reason:
- Avatar profile persistence is one of the stabilization tables. A generic sync failure is less useful than clearly saying the Supabase save did not happen.

Consequence:
- Phone testers can distinguish a local avatar profile from a Supabase-persisted avatar profile.
## 2026-05-11T16:24 - Persist Save Look Local Fallback Explicitly

Decision:
- Add a local-only Saved Looks write and call it when Save Look Supabase persistence fails.

Reason:
- Save Look first syncs the try-on job, then the saved look. If the job sync fails first, the UI could say local copy kept while only in-memory state existed.

Consequence:
- Save Look failure fallback now survives restart even when the failure happens before saved-look Supabase sync.
## 2026-05-11T16:26 - Surface Saved Look Thumbnail Failures

Decision:
- Show a visible error when a Saved Look gallery thumbnail fails to load.

Reason:
- A blank gallery thumbnail is difficult to distinguish from missing data. The tester needs a clear recovery action: open the look to refresh the result image.

Consequence:
- Thumbnail rendering problems are visible during phone verification without changing the durable result-image recovery path.
## 2026-05-11T16:29 - Prefer Proxy On Saved Look Refresh Failure

Decision:
- When opening a Saved Look, use the backend object proxy if signed URL refresh fails and `resultStoragePath` exists.

Reason:
- Durable storage path is the source of truth. A failed signed URL refresh should not leave the app relying only on an expired URL or local backend URL.

Consequence:
- Saved Look open has a stronger nonblank image fallback path after restart/navigation.
## 2026-05-11T16:32 - Name Saved Look Refresh Fallback Source

Decision:
- Saved Look refresh failure messages should name the fallback source used.

Reason:
- During phone verification, `local fallback` is misleading when the app actually uses the backend private-object proxy.

Consequence:
- Tester evidence can distinguish backend proxy recovery, local backend recovery, and refresh failure without fallback.
## 2026-05-11T16:35 - Merge Local Fallbacks On Reload

Decision:
- Merge local fallback people, wardrobe items, and Saved Looks after Supabase reloads.

Reason:
- When Supabase is configured, reload previously preferred only remote rows. That could make a failed-save local fallback disappear after restart, contradicting the UI copy that the local copy was kept.

Consequence:
- Local fallback items remain visible after restart/navigation while Supabase rows remain the first source of truth.
## 2026-05-11T16:38 - Report Save Look Double Failure

Decision:
- Catch and report local fallback storage failure inside the Save Look Supabase failure path.

Reason:
- The Save Look path promises a local copy if Supabase sync fails. If local storage also fails, the UI needs to say that explicitly rather than silently losing the failure context.

Consequence:
- Save Look has explicit messaging for Supabase failure with local fallback and for Supabase plus local storage failure.
## 2026-05-11T16:41 - Prefer Newer Local Avatar Profile

Decision:
- When loading avatar measurements, prefer the local profile if its `updatedAt` is newer than the Supabase row.

Reason:
- Avatar save writes local storage before Supabase. If the Supabase write fails, an older remote row could otherwise hide the local profile that the UI said was kept.

Consequence:
- Failed avatar profile syncs remain visible after restart/navigation until Supabase catches up.
## 2026-05-11T16:44 - Delete Person And Wardrobe Remotely Before Local Storage

Decision:
- For person image and wardrobe deletes, write the local deleted list only after Supabase delete succeeds.

Reason:
- If Supabase rejects a delete, persisting local deletion makes the item appear deleted locally but reappear from Supabase later. That weakens phone verification.

Consequence:
- Failed deletes restore the item locally and clearly report that Supabase was not updated.
