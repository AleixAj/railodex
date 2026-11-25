-- Railodex: composiciones (trenes formados con piezas de la colección) y lista de deseos.

-- ─────────────────────────────────────────────────────────────
-- Composiciones
-- ─────────────────────────────────────────────────────────────
create table public.compositions (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name       text not null check (char_length(name) between 1 and 120),
  notes      text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index compositions_user_idx on public.compositions (user_id, created_at desc);

create trigger compositions_set_updated_at
before update on public.compositions
for each row execute function public.set_updated_at();

-- Una pieza puede estar en varias composiciones, pero solo una vez en cada una.
create table public.composition_items (
  composition_id uuid not null references public.compositions (id) on delete cascade,
  item_id        uuid not null references public.items (id) on delete cascade,
  user_id        uuid not null default auth.uid() references auth.users (id) on delete cascade,
  position       integer not null default 0,
  primary key (composition_id, item_id)
);
create index composition_items_item_idx on public.composition_items (item_id);
create index composition_items_user_idx on public.composition_items (user_id);

-- ─────────────────────────────────────────────────────────────
-- Lista de deseos (piezas que aún no tengo)
-- ─────────────────────────────────────────────────────────────
create table public.wishes (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name          text not null check (char_length(name) between 1 and 200),
  kind          text check (kind in ('locomotora', 'automotor', 'coche', 'vagon', 'accesorio')),
  manufacturer  text,
  catalog_ref   text,
  scale         text,
  railway       text,
  priority      smallint not null default 2 check (priority between 1 and 3),
  target_price  numeric(10, 2) check (target_price >= 0),
  shop          text,
  url           text check (url is null or url ~* '^https?://'),
  status        text not null default 'deseo' check (status in ('deseo', 'reservada')),
  deposit       numeric(10, 2) check (deposit >= 0),
  expected_date date,
  notes         text,
  created_at    timestamptz not null default now()
);
create index wishes_user_idx on public.wishes (user_id, priority, created_at desc);

-- ─────────────────────────────────────────────────────────────
-- Permisos y RLS (mismo modelo: cada usuario solo lo suyo)
-- ─────────────────────────────────────────────────────────────
grant select, insert, update, delete on public.compositions      to authenticated, service_role;
grant select, insert, update, delete on public.composition_items to authenticated, service_role;
grant select, insert, update, delete on public.wishes            to authenticated, service_role;

alter table public.compositions      enable row level security;
alter table public.composition_items enable row level security;
alter table public.wishes            enable row level security;

create policy "composiciones: ver las mías" on public.compositions
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "composiciones: crear las mías" on public.compositions
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "composiciones: editar las mías" on public.compositions
  for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "composiciones: borrar las mías" on public.compositions
  for delete to authenticated using ((select auth.uid()) = user_id);

-- La composición y la pieza tienen que ser mías.
create policy "composición-piezas: ver las mías" on public.composition_items
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "composición-piezas: añadir las mías" on public.composition_items
  for insert to authenticated with check (
    (select auth.uid()) = user_id
    and exists (select 1 from public.compositions c where c.id = composition_id and c.user_id = (select auth.uid()))
    and exists (select 1 from public.items i where i.id = item_id and i.user_id = (select auth.uid()))
  );
create policy "composición-piezas: ordenar las mías" on public.composition_items
  for update to authenticated using ((select auth.uid()) = user_id) with check (
    (select auth.uid()) = user_id
    and exists (select 1 from public.compositions c where c.id = composition_id and c.user_id = (select auth.uid()))
    and exists (select 1 from public.items i where i.id = item_id and i.user_id = (select auth.uid()))
  );
create policy "composición-piezas: quitar las mías" on public.composition_items
  for delete to authenticated using ((select auth.uid()) = user_id);

create policy "deseos: ver los míos" on public.wishes
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "deseos: crear los míos" on public.wishes
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "deseos: editar los míos" on public.wishes
  for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "deseos: borrar los míos" on public.wishes
  for delete to authenticated using ((select auth.uid()) = user_id);
