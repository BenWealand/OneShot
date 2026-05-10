# Supabase Setup

Create a Supabase project, then add these values to `fitshelf-app/.env`:

```bash
EXPO_PUBLIC_SUPABASE_URL=...
EXPO_PUBLIC_SUPABASE_ANON_KEY=...
```

## Storage
Create a public bucket:

- `fitshelf-assets`

The MVP stores selected local image URIs in demo mode. In configured mode, selected mannequin and clothing images are uploaded to the `fitshelf-assets` bucket and their public URLs are saved with the related records.

## Tables

```sql
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  created_at timestamptz default now()
);

create table if not exists mannequins (
  id text primary key,
  user_id uuid references auth.users(id) on delete cascade,
  name text not null,
  image_uri text not null,
  created_at timestamptz default now()
);

create table if not exists clothing_items (
  id text primary key,
  user_id uuid references auth.users(id) on delete cascade,
  name text not null,
  category text not null,
  image_uri text not null,
  created_at timestamptz default now()
);

create table if not exists outfits (
  id text primary key,
  user_id uuid references auth.users(id) on delete cascade,
  name text not null,
  mannequin_id text references mannequins(id),
  mannequin_uri text,
  layers jsonb not null default '[]'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
```

## Row Level Security

Enable RLS on all tables and restrict each table to the authenticated user's `user_id`.
