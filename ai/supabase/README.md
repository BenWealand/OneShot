# FitShelf Supabase Setup

## 1. Apply The Schema

Open the Supabase SQL editor and run:

```sql
-- paste ai/supabase/schema.sql
```

For an existing FitShelf Supabase project that already has the base tables, you
can run the smaller idempotent patch instead:

```sql
-- paste ai/supabase/stabilization_patch.sql
```

This patch adds the latest persistence columns and Storage policy used by the
stabilization app. It also runs `notify pgrst, 'reload schema';` so PostgREST
refreshes its schema cache after the column changes.

The schema creates:

- `profiles`
- `tryon_jobs`
- `saved_looks`
- `avatar_profiles`
- `person_images`
- `wardrobe_items`

RLS is enabled on every user-owned table. Policies require `auth.uid() = id` for
`profiles` and `auth.uid() = user_id` for user data tables.

`saved_looks` stores both temporary display URLs and permanent recovery data:

- `result_url`: the last display URL returned to the app.
- `result_storage_path`: the private object path in the `tryon-results` bucket.
- `local_result_url`: the backend `/results/.../result.jpg` fallback.
- `tryon_job_id`: the completed `tryon_jobs.id` linked to the saved render.

Do not treat a signed URL as permanent. If a saved look has
`result_storage_path`, refresh it through the backend before display.

## 2. Create Storage Buckets

The schema creates/updates these buckets when run with sufficient SQL
privileges:

- `fitshelf-assets`: public app-uploaded person/garment assets.
- `tryon-results`: private backend-uploaded CatVTON result images.

If you create buckets manually, create a private bucket named:

```text
tryon-results
```

Or use another private result bucket name and set `SUPABASE_TRYON_BUCKET` to match.
The backend uploads CatVTON result images with the service-role key and returns
signed URLs. The Expo app should not upload try-on results directly and should
never hold the service-role key.

Also create a public bucket named:

```text
fitshelf-assets
```

The Expo app uploads Save Person and Save Garment assets there through the
signed-in anon-key session. Storage object paths begin with the authenticated
`user_id`, and the schema policy only allows users to manage objects under
their own ID prefix.

## 3. Configure Env Files

Expo app, `fitshelf-app/.env`:

```dotenv
EXPO_PUBLIC_SUPABASE_URL=...
EXPO_PUBLIC_SUPABASE_ANON_KEY=...
```

Backend, `ai/backend/.env`:

```dotenv
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
SUPABASE_TRYON_BUCKET=tryon-results
```

Never put `SUPABASE_SERVICE_ROLE_KEY` in `fitshelf-app/.env`.

## 4. Configure Auth Redirect URLs

In the Supabase Dashboard, open:

```text
Authentication -> URL Configuration
```

Set `Site URL` to a URL that is valid for the environment you are testing.
For local app development, the Site URL can be your Expo development URL. The
important setting is the allow-list below.

Add every development redirect URL that the app may generate to `Redirect URLs`.
FitShelf uses Expo Linking with this callback path:

```text
auth/callback
```

The app displays the exact redirect URL on the sign-in screen. Copy that value
into Supabase while testing.

Common development examples:

```text
fitshelf://auth/callback
exp://127.0.0.1:8081/--/auth/callback
exp://localhost:8081/--/auth/callback
exp://<lan-ip>:8081/--/auth/callback
exp://<expo-go-lan-host>:<port>/--/auth/callback
https://<expo-tunnel-host>/--/auth/callback
```

For Expo Go on a phone, the redirect URL often changes when the Metro host,
port, LAN IP, or tunnel changes. If email verification opens
`http://localhost:3000/#access_token=...`, Supabase is not using the app
redirect. Add the exact in-app redirect URL shown by FitShelf and sign up again.

For a production standalone app, keep this scheme in `fitshelf-app/app.json`:

```json
{
  "expo": {
    "scheme": "fitshelf"
  }
}
```

Then add the production redirect:

```text
fitshelf://auth/callback
```

FitShelf passes this redirect as `emailRedirectTo` during signup and handles
both `code=...` and `#access_token=...&refresh_token=...` callbacks.
If the phone browser opens the callback instead of returning to Expo, copy the
full callback URL, paste it into `Paste verification callback URL` on the
FitShelf sign-in screen, and tap `Restore callback`.

## 5. Smoke Check

From the repo root:

```powershell
.\ai\scripts\start_backend.ps1
```

Then request:

```text
GET http://127.0.0.1:8000/supabase/health
```

Expected result when configured:

- `configured: true`
- `bucket_exists: true`
- `upload_ok: true`
- `signed_url_ok: true`

If this fails, the app still keeps local Saved Looks and local avatar profile
data through AsyncStorage.

To refresh a private result image URL without rerendering:

```text
GET http://127.0.0.1:8000/supabase/sign?storage_path=<saved result_storage_path>
```

If React Native cannot display the signed URL directly, use the backend private
object proxy:

```text
GET http://127.0.0.1:8000/supabase/object?storage_path=<saved result_storage_path>
```

Database smoke check:

```text
GET http://127.0.0.1:8000/supabase/db-health
```

Expected result after the schema/patch is applied:

```json
{
  "priority_tables_ok": true,
  "patch_file": "ai/supabase/stabilization_patch.sql",
  "error": null
}
```

Read-only schema check:

```text
GET http://127.0.0.1:8000/supabase/schema-health
```

Run this before phone testing. Expected result after `schema.sql` or
`stabilization_patch.sql` is applied:

```json
{
  "ok": true,
  "missing": []
}
```

The app-side `Test DB Write` action uses the signed-in anon-key session, creates
the `profiles` row if needed, then writes and reads harmless rows across
`person_images`, `wardrobe_items`, `tryon_jobs`, `saved_looks`, and
`avatar_profiles`. It deletes the transient person, wardrobe, try-on job, and
saved look rows after the check. This is the check to use for RLS/user-owned
data.

The app-side `Test Asset Upload` action uses the signed-in anon-key session to
upload and delete a harmless text object under:

```text
<user_id>/_debug/
```

in `fitshelf-assets`. This is the check to use for the Storage policy that Save
Person and Save Garment need.

## 6. Physical Phone Persistence Checklist

Run this checklist only after backend `/supabase/schema-health` returns `ok=true`
and `/supabase/db-health` returns `priority_tables_ok=true`.

1. Sign in on the phone and confirm the profile is ready.
2. Tap `Test Backend Schema`; it should pass.
3. Tap `Test Backend DB`; it should report backend priority tables writable.
4. Tap `Test DB Write`; it should report all priority tables writable from the signed-in app session.
5. Tap `Test Asset Upload`; it should report that `fitshelf-assets` accepts the user path.
6. In Try-On, tap `Save Person`; confirm the app says it saved to Supabase and a `person_images` row exists for the signed-in `user_id`.
7. Tap `Save Garment`; confirm the app says it saved to Supabase and a `wardrobe_items` row exists for the signed-in `user_id`.
8. Render Preview; confirm a `tryon_jobs` row exists for the signed-in `user_id`.
9. Tap `Save Look`; confirm a `saved_looks` row exists with `tryon_job_id`, `result_storage_path`, and the signed-in `user_id`.
10. Restart the app or navigate away and back; confirm saved person, garment, avatar profile, and saved look reload from Supabase.
11. Open Avatar and confirm the GLB loads, drag rotation works, and pinch zoom works. If GLB fails, the fallback should appear instead of a blank canvas.
