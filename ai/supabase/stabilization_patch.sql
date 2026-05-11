-- FitShelf stabilization patch.
-- Safe to run more than once in the Supabase SQL editor.

create extension if not exists pgcrypto;

insert into storage.buckets (id, name, public)
values ('fitshelf-assets', 'fitshelf-assets', true)
on conflict (id) do update set public = true;

insert into storage.buckets (id, name, public)
values ('tryon-results', 'tryon-results', false)
on conflict (id) do nothing;

alter table person_images add column if not exists label text;
alter table person_images add column if not exists image_url text;

alter table wardrobe_items add column if not exists color text;
alter table wardrobe_items add column if not exists favorite boolean not null default false;
alter table wardrobe_items add column if not exists image_url text;
alter table wardrobe_items drop constraint if exists wardrobe_items_category_check;
alter table wardrobe_items add constraint wardrobe_items_category_check check (category in ('top', 'bottom', 'outerwear', 'dress', 'shoe', 'accessory'));

alter table saved_looks add column if not exists result_storage_path text;
alter table saved_looks add column if not exists local_result_url text;
alter table saved_looks add column if not exists tryon_job_id uuid references tryon_jobs(id);

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
