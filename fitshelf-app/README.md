# FitShelf MVP

Expo React Native MVP for a practical mannequin-based outfit builder.

## Run

```bash
npm install
npm run typecheck
npm start
```

The app works in local demo mode without Supabase credentials. Add Supabase values to `.env` to enable configured auth/storage/database mode:

```bash
EXPO_PUBLIC_SUPABASE_URL=...
EXPO_PUBLIC_SUPABASE_ANON_KEY=...
```

## Supabase Email Redirects

FitShelf uses Expo Linking for email confirmation callbacks:

```text
auth/callback
```

The sign-in screen shows the exact redirect URL generated for the current Expo
session. Add that value in Supabase Dashboard:

```text
Authentication -> URL Configuration -> Redirect URLs
```

Also add the eventual production scheme:

```text
fitshelf://auth/callback
```

For Expo Go, allow the LAN or tunnel URL shown in the app, for example:

```text
exp://<lan-ip>:8081/--/auth/callback
https://<expo-tunnel-host>/--/auth/callback
```

If verification emails open `http://localhost:3000/#access_token=...`, the
redirect allow-list is wrong or missing. Add the exact redirect shown in the app
and sign up again. If the phone browser shows a full callback URL containing
`code=` or access tokens, paste that full URL into `Paste verification callback
URL` on the FitShelf sign-in screen and tap `Restore callback`. If you manually
return to FitShelf after opening the email link, tap `Check session` first; it
will enter the app if Supabase already stored the session.

## Local Try-On Backend

Start the FastAPI backend from the repo root:

```powershell
cd C:\Users\benwe\Projects\OneShot
.\ai\scripts\start_backend.ps1
```

Use `http://127.0.0.1:8000` for local simulators that share localhost. For a
physical phone over hotspot/LAN, set `EXPO_PUBLIC_FITSHELF_BACKEND_URL` or the
Try-On panel backend field to `http://<workstation-ip>:8000`.

The Try-On panel supports:
- Preview render: `384x512`, 20 steps, `fp16`.
- HD render: `768x1024`, 50 steps, no mixed precision.
- Clear Save Person, Save Garment, and Save Look actions.
- Signed-in Supabase sync for person images, wardrobe items, try-on jobs, saved looks, and avatar profiles, with local fallback when signed out.
- Person and garment cloud rows are only written when the asset upload returns a real `fitshelf-assets` storage path.
- Private Supabase result images through backend-signed URLs, with local backend fallback if a signed URL expires or fails to load.
- Backend private-object proxy fallback for devices that fail to display Supabase signed URLs directly.
- Side-by-side before/result comparison.
- `Test Backend Schema` against the configured backend URL so a phone can see
  missing Supabase schema columns before rendering.
- `Test Backend DB` against the configured backend URL so a phone can verify
  backend service-role priority table write/read/delete health before saving.

The 3D Avatar section uses React Three Fiber native with Expo GL and a `.glb`
default avatar asset. It provides touch drag rotation, pinch zoom, and local
measurement profile. The current GLB is not rigged for true morph targets, so
height/weight/body measurements apply approximate whole-model scaling when the
GLB loads and more visible body-region scaling in the procedural fallback. It
does not perform 3D garment simulation.

Metro is configured for `.glb`, `.gltf`, `png`, `jpg`, `jpeg`, `cjs`, and `mjs`
so R3F native/Drei native loaders can resolve model assets. Expo Go should run
the fallback path if GLB loading is unreliable on a device.

Regenerate the bundled neutral mannequin asset from the Expo app directory:

```bash
node scripts/generate-avatar-glb.mjs
```

Use the header `Test Supabase` action after signing in to verify app-side auth
and profile access. Use `Test DB Write` to write/read/delete harmless rows across
`profiles`, `person_images`, `wardrobe_items`, `tryon_jobs`, and `saved_looks`,
and to write/read `avatar_profiles` through RLS. Use `Test Asset Upload` to upload and
delete a harmless file under `<user_id>/_debug/` in `fitshelf-assets`, which
checks the Storage policy required by Save Person and Save Garment. Signing out
returns the app to local fallback mode.

Before a physical phone persistence test:

1. Apply `ai/supabase/stabilization_patch.sql` in Supabase SQL editor.
2. Start the backend and confirm `/supabase/schema-health` returns `ok=true`.
3. Confirm `/supabase/db-health` returns `priority_tables_ok=true`.
4. On the phone, confirm auth recovery through automatic redirect, `Check session`, or `Restore callback`.
5. On the signed-in phone, tap `Test Backend Schema`, `Test Backend DB`, `Test DB Write`, and `Test Asset Upload`.
6. Save Person and Save Garment. The message should say `saved to Supabase`; if it says `saved locally only`, fix sign-in or Storage policy first.
7. Render Preview, tap Save Look, restart or navigate away and back, then confirm the saved person, garment, avatar profile, try-on job, and saved look reload.

## MVP Features
- Email/password auth when Supabase is configured.
- Local demo mode when credentials are absent.
- Mannequin image selection.
- Clothing image selection and categorized library.
- Wardrobe grid with category filters, editable brand/color/notes, favorite, delete, and product URL import.
- Reusable person image library with labels and delete.
- Outfit builder with layered clothing over the mannequin.
- Pan gesture plus fallback sliders for x/y, scale, and rotation.
- Saved outfits that can be loaded later.
- AI try-on result history.
- Try-on job metadata persistence when signed in.
- 3D avatar foundation with local measurements.

## Supabase
See [docs/supabase-setup.md](docs/supabase-setup.md).
