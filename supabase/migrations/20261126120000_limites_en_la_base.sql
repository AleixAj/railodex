-- Railodex: limits enforced by the database itself.
--
-- The app already checks all of this, but the publishable key lets anyone who is logged in
-- talk to the Data API directly, skipping the app. These rules make sure that path can't
-- go past the free plan, fill the storage with photos or store huge texts.

-- ─────────────────────────────────────────────────────────────
-- Free plan: at most 100 pieces per user.
-- Keep in sync with FREE_PLAN_LIMIT in src/lib/catalog.ts. When paid plans arrive,
-- this is where the user's plan gets looked up.
-- ─────────────────────────────────────────────────────────────
create function public.enforce_item_limit()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  -- One insert at a time per user, so two tabs saving at once can't both slip under the limit.
  perform pg_advisory_xact_lock(hashtext('items:' || new.user_id::text));
  if (select count(*) from public.items where user_id = new.user_id) >= 100 then
    raise exception 'Límite de 100 piezas del plan Gratis' using errcode = 'P0001', hint = 'plan_limit';
  end if;
  return new;
end;
$$;

create trigger items_enforce_limit
before insert on public.items
for each row execute function public.enforce_item_limit();

-- ─────────────────────────────────────────────────────────────
-- Photos: at most 8 per piece (the same as the form allows).
-- ─────────────────────────────────────────────────────────────
create function public.enforce_photo_limit()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  perform pg_advisory_xact_lock(hashtext('photos:' || new.item_id::text));
  if (select count(*) from public.item_photos where item_id = new.item_id) >= 8 then
    raise exception 'Máximo 8 fotos por pieza' using errcode = 'P0001', hint = 'photo_limit';
  end if;
  return new;
end;
$$;

create trigger item_photos_enforce_limit
before insert on public.item_photos
for each row execute function public.enforce_photo_limit();

-- ─────────────────────────────────────────────────────────────
-- Text sizes, matching what the forms cut them to.
-- ─────────────────────────────────────────────────────────────
alter table public.items
  add constraint items_name_len check (char_length(name) between 1 and 200),
  add constraint items_manufacturer_len check (char_length(manufacturer) between 1 and 200),
  add constraint items_location_len check (location is null or char_length(location) <= 200),
  add constraint items_notes_len check (notes is null or char_length(notes) <= 4000),
  add constraint items_tags_count check (cardinality(tags) <= 20),
  add constraint items_details_size check (pg_column_size(details) <= 16384);

alter table public.item_events
  add constraint item_events_title_len check (char_length(title) between 1 and 200),
  add constraint item_events_notes_len check (notes is null or char_length(notes) <= 2000);

alter table public.compositions
  add constraint compositions_notes_len check (notes is null or char_length(notes) <= 2000);

alter table public.wishes
  add constraint wishes_notes_len check (notes is null or char_length(notes) <= 2000);
