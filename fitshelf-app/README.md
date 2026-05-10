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

## MVP Features
- Email/password auth when Supabase is configured.
- Local demo mode when credentials are absent.
- Mannequin image selection.
- Clothing image selection and categorized library.
- Outfit builder with layered clothing over the mannequin.
- Pan gesture plus fallback sliders for x/y, scale, and rotation.
- Saved outfits that can be loaded later.

## Supabase
See [docs/supabase-setup.md](docs/supabase-setup.md).
