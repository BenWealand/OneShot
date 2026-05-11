create extension if not exists pgcrypto;

insert into storage.buckets (id, name, public)
values ('fitshelf-assets', 'fitshelf-assets', true)
on conflict (id) do update set public = true;

insert into storage.buckets (id, name, public)
values ('tryon-results', 'tryon-results', false)
on conflict (id) do nothing;

create table if not exists profiles (
  id uuid primary key,
  email text,
  created_at timestamptz not null default now()
);

create table if not exists person_images (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  label text,
  storage_path text not null,
  image_url text,
  is_default boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists wardrobe_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  name text not null,
  category text not null check (category in ('top', 'bottom', 'outerwear', 'dress', 'shoe', 'accessory')),
  storage_path text not null,
  source_url text,
  brand text,
  color text,
  notes text,
  favorite boolean not null default false,
  image_url text,
  created_at timestamptz not null default now()
);

alter table person_images add column if not exists label text;
alter table person_images add column if not exists image_url text;
alter table wardrobe_items add column if not exists color text;
alter table wardrobe_items add column if not exists favorite boolean not null default false;
alter table wardrobe_items add column if not exists image_url text;
alter table wardrobe_items drop constraint if exists wardrobe_items_category_check;
alter table wardrobe_items add constraint wardrobe_items_category_check check (category in ('top', 'bottom', 'outerwear', 'dress', 'shoe', 'accessory'));

create table if not exists tryon_jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  person_image_id uuid references person_images(id),
  wardrobe_item_id uuid references wardrobe_items(id),
  category text not null check (category in ('upper', 'lower', 'dress')),
  render_mode text check (render_mode in ('preview', 'hd')),
  width integer,
  height integer,
  steps integer,
  precision text,
  backend text,
  status text not null default 'queued',
  result_storage_path text,
  result_url text,
  error text,
  elapsed_seconds numeric,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create table if not exists saved_looks (
  id text primary key,
  user_id uuid not null references profiles(id) on delete cascade,
  name text not null,
  tryon_job_id uuid references tryon_jobs(id),
  category text not null check (category in ('upper', 'lower', 'dress')),
  render_mode text not null check (render_mode in ('preview', 'hd')),
  width integer,
  height integer,
  steps integer,
  precision text,
  backend text,
  result_url text not null,
  result_storage_path text,
  local_result_url text,
  person_uri text,
  garment_uri text,
  elapsed_seconds numeric,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table saved_looks add column if not exists result_storage_path text;
alter table saved_looks add column if not exists local_result_url text;
alter table saved_looks add column if not exists tryon_job_id uuid references tryon_jobs(id);

create table if not exists avatar_profiles (
  user_id uuid primary key references profiles(id) on delete cascade,
  avatar_mode text not null default 'female' check (avatar_mode in ('female', 'male')),
  height numeric,
  weight numeric,
  chest numeric,
  waist numeric,
  hips numeric,
  inseam numeric,
  shoulder_width numeric,
  updated_at timestamptz not null default now()
);

alter table profiles enable row level security;
alter table person_images enable row level security;
alter table wardrobe_items enable row level security;
alter table tryon_jobs enable row level security;
alter table saved_looks enable row level security;
alter table avatar_profiles enable row level security;

drop policy if exists "profiles own rows" on profiles;
drop policy if exists "person images own rows" on person_images;
drop policy if exists "wardrobe own rows" on wardrobe_items;
drop policy if exists "tryon jobs own rows" on tryon_jobs;
drop policy if exists "saved looks own rows" on saved_looks;
drop policy if exists "avatar profiles own rows" on avatar_profiles;

create policy "profiles own rows" on profiles for all using (auth.uid() = id) with check (auth.uid() = id);
create policy "person images own rows" on person_images for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "wardrobe own rows" on wardrobe_items for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "tryon jobs own rows" on tryon_jobs for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "saved looks own rows" on saved_looks for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "avatar profiles own rows" on avatar_profiles for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "fitshelf assets own objects" on storage.objects;
create policy "fitshelf assets own objects" on storage.objects
for all
using (
  bucket_id = 'fitshelf-assets'
  and auth.uid()::text = (storage.foldername(name))[1]
)
with check (
  bucket_id = 'fitshelf-assets'
  and auth.uid()::text = (storage.foldername(name))[1]
);

notify pgrst, 'reload schema';
