-- Railodex: colección de piezas, fotos e historial de mantenimiento.
-- Cada usuario solo puede ver y tocar sus propias filas (RLS).

-- ─────────────────────────────────────────────────────────────
-- Piezas
-- Las columnas por las que se filtra u ordena van como columnas.
-- Los datos que dependen del tipo (rodaje, decoder, funciones…)
-- van en `details` (jsonb) para poder añadir campos sin migrar.
-- ─────────────────────────────────────────────────────────────
create table public.items (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null default auth.uid() references auth.users (id) on delete cascade,

  kind            text not null check (kind in ('locomotora', 'automotor', 'coche', 'vagon', 'accesorio')),
  traction        text check (traction in ('vapor', 'diesel', 'electrica', 'hibrida')),
  system          text check (system in ('digital', 'analogico')),

  name            text not null,
  manufacturer    text not null,
  catalog_ref     text,
  scale           text not null,
  epoch           text,
  railway         text,
  road_number     text,
  dcc_address     integer check (dcc_address between 1 and 10239),

  condition       text check (condition in ('nuevo', 'como_nuevo', 'usado', 'para_reparar', 'para_piezas')),
  status          text not null default 'coleccion' check (status in ('coleccion', 'preventa', 'prestada', 'vendida')),
  purchase_price  numeric(10, 2) check (purchase_price >= 0),
  estimated_value numeric(10, 2) check (estimated_value >= 0),
  currency        text not null default 'EUR',
  purchase_date   date,
  location        text,
  tags            text[] not null default '{}',
  notes           text,
  details         jsonb not null default '{}'::jsonb,

  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index items_user_created_idx on public.items (user_id, created_at desc);
create index items_user_address_idx on public.items (user_id, dcc_address) where dcc_address is not null;

-- ─────────────────────────────────────────────────────────────
-- Fotos (los archivos viven en Storage, bucket `item-photos`,
-- dentro de una carpeta con el id del usuario)
-- ─────────────────────────────────────────────────────────────
create table public.item_photos (
  id         uuid primary key default gen_random_uuid(),
  item_id    uuid not null references public.items (id) on delete cascade,
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  path       text not null,
  position   integer not null default 0,
  created_at timestamptz not null default now()
);

create index item_photos_item_idx on public.item_photos (item_id, position);
create index item_photos_user_idx on public.item_photos (user_id);

-- ─────────────────────────────────────────────────────────────
-- Historial (mantenimiento, reparaciones, cambios de ubicación…)
-- ─────────────────────────────────────────────────────────────
create table public.item_events (
  id         uuid primary key default gen_random_uuid(),
  item_id    uuid not null references public.items (id) on delete cascade,
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  happened_on date not null default current_date,
  kind       text not null check (kind in ('mantenimiento', 'reparacion', 'digitalizacion', 'ubicacion', 'otro')),
  title      text not null,
  cost       numeric(10, 2) check (cost >= 0),
  notes      text,
  created_at timestamptz not null default now()
);

create index item_events_item_idx on public.item_events (item_id, happened_on desc);
create index item_events_user_idx on public.item_events (user_id);

-- ─────────────────────────────────────────────────────────────
-- updated_at automático
-- ─────────────────────────────────────────────────────────────
create function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger items_set_updated_at
before update on public.items
for each row execute function public.set_updated_at();

-- ─────────────────────────────────────────────────────────────
-- Acceso: solo usuarios con sesión, y solo a sus filas.
-- Desde oct 2026 las tablas nuevas no se exponen solas a la API,
-- así que damos los permisos a mano (y nada a `anon`).
-- ─────────────────────────────────────────────────────────────
grant select, insert, update, delete on public.items       to authenticated, service_role;
grant select, insert, update, delete on public.item_photos to authenticated, service_role;
grant select, insert, update, delete on public.item_events to authenticated, service_role;

alter table public.items       enable row level security;
alter table public.item_photos enable row level security;
alter table public.item_events enable row level security;

create policy "items: ver las mías" on public.items
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "items: crear las mías" on public.items
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "items: editar las mías" on public.items
  for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "items: borrar las mías" on public.items
  for delete to authenticated using ((select auth.uid()) = user_id);

-- Fotos y eventos: además de ser míos, la pieza a la que apuntan también tiene que ser mía.
create policy "fotos: ver las mías" on public.item_photos
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "fotos: crear las mías" on public.item_photos
  for insert to authenticated with check (
    (select auth.uid()) = user_id
    and exists (select 1 from public.items i where i.id = item_id and i.user_id = (select auth.uid()))
  );
create policy "fotos: editar las mías" on public.item_photos
  for update to authenticated using ((select auth.uid()) = user_id) with check (
    (select auth.uid()) = user_id
    and exists (select 1 from public.items i where i.id = item_id and i.user_id = (select auth.uid()))
  );
create policy "fotos: borrar las mías" on public.item_photos
  for delete to authenticated using ((select auth.uid()) = user_id);

create policy "eventos: ver los míos" on public.item_events
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "eventos: crear los míos" on public.item_events
  for insert to authenticated with check (
    (select auth.uid()) = user_id
    and exists (select 1 from public.items i where i.id = item_id and i.user_id = (select auth.uid()))
  );
create policy "eventos: editar los míos" on public.item_events
  for update to authenticated using ((select auth.uid()) = user_id) with check (
    (select auth.uid()) = user_id
    and exists (select 1 from public.items i where i.id = item_id and i.user_id = (select auth.uid()))
  );
create policy "eventos: borrar los míos" on public.item_events
  for delete to authenticated using ((select auth.uid()) = user_id);

-- ─────────────────────────────────────────────────────────────
-- Storage: bucket privado para fotos, 5 MB por archivo, solo imágenes.
-- Cada usuario solo accede a la carpeta con su id: <user_id>/<item_id>/<archivo>
-- ─────────────────────────────────────────────────────────────
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('item-photos', 'item-photos', false, 5242880, array['image/jpeg', 'image/png', 'image/webp', 'image/avif'])
on conflict (id) do nothing;

create policy "item-photos: ver las mías" on storage.objects
  for select to authenticated
  using (bucket_id = 'item-photos' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "item-photos: subir las mías" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'item-photos' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "item-photos: reemplazar las mías" on storage.objects
  for update to authenticated
  using (bucket_id = 'item-photos' and (storage.foldername(name))[1] = (select auth.uid())::text)
  with check (bucket_id = 'item-photos' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "item-photos: borrar las mías" on storage.objects
  for delete to authenticated
  using (bucket_id = 'item-photos' and (storage.foldername(name))[1] = (select auth.uid())::text);
