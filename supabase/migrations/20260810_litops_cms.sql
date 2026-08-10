-- Litops Atelier CMS: products, legal documents, orders, messages and product images.
-- Run this migration in a new Supabase project before enabling the admin panel.

create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.admin_users enable row level security;
grant select on public.admin_users to authenticated;

drop policy if exists "admin can view own membership" on public.admin_users;
create policy "admin can view own membership"
on public.admin_users for select
to authenticated
using (user_id = auth.uid());

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.admin_users where user_id = auth.uid()
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

create table if not exists public.store_products (
  id text primary key check (char_length(id) between 2 and 100),
  data jsonb not null,
  published boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists store_products_public_order_idx
on public.store_products (published, sort_order);

alter table public.store_products enable row level security;
grant select on public.store_products to anon, authenticated;
grant insert, update, delete on public.store_products to authenticated;

drop policy if exists "published products are public" on public.store_products;
create policy "published products are public"
on public.store_products for select
to anon, authenticated
using (published or public.is_admin());

drop policy if exists "admins insert products" on public.store_products;
create policy "admins insert products"
on public.store_products for insert
to authenticated
with check (public.is_admin());

drop policy if exists "admins update products" on public.store_products;
create policy "admins update products"
on public.store_products for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "admins delete products" on public.store_products;
create policy "admins delete products"
on public.store_products for delete
to authenticated
using (public.is_admin());

create table if not exists public.legal_documents (
  slug text primary key check (char_length(slug) between 2 and 100),
  title text not null check (char_length(title) between 2 and 250),
  summary text not null default '',
  body text not null,
  published boolean not null default true,
  sort_order integer not null default 0,
  updated_at timestamptz not null default now()
);

alter table public.legal_documents enable row level security;
grant select on public.legal_documents to anon, authenticated;
grant insert, update, delete on public.legal_documents to authenticated;

drop policy if exists "published legal documents are public" on public.legal_documents;
create policy "published legal documents are public"
on public.legal_documents for select
to anon, authenticated
using (published or public.is_admin());

drop policy if exists "admins insert legal documents" on public.legal_documents;
create policy "admins insert legal documents"
on public.legal_documents for insert
to authenticated
with check (public.is_admin());

drop policy if exists "admins update legal documents" on public.legal_documents;
create policy "admins update legal documents"
on public.legal_documents for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "admins delete legal documents" on public.legal_documents;
create policy "admins delete legal documents"
on public.legal_documents for delete
to authenticated
using (public.is_admin());

create table if not exists public.store_orders (
  id text primary key check (char_length(id) between 4 and 80),
  payload jsonb not null,
  status text not null default 'Новый',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists store_orders_created_idx on public.store_orders (created_at desc);
alter table public.store_orders enable row level security;
grant insert on public.store_orders to anon, authenticated;
grant select, update on public.store_orders to authenticated;

drop policy if exists "visitors create orders" on public.store_orders;
create policy "visitors create orders"
on public.store_orders for insert
to anon, authenticated
with check (status = 'Новый' and jsonb_typeof(payload) = 'object');

drop policy if exists "admins read orders" on public.store_orders;
create policy "admins read orders"
on public.store_orders for select
to authenticated
using (public.is_admin());

drop policy if exists "admins update orders" on public.store_orders;
create policy "admins update orders"
on public.store_orders for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

create table if not exists public.custom_requests (
  id text primary key check (char_length(id) between 4 and 80),
  payload jsonb not null,
  status text not null default 'Новая',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists custom_requests_created_idx on public.custom_requests (created_at desc);
alter table public.custom_requests enable row level security;
grant insert on public.custom_requests to anon, authenticated;
grant select, update on public.custom_requests to authenticated;

drop policy if exists "visitors create custom requests" on public.custom_requests;
create policy "visitors create custom requests"
on public.custom_requests for insert
to anon, authenticated
with check (status = 'Новая' and jsonb_typeof(payload) = 'object');

drop policy if exists "admins read custom requests" on public.custom_requests;
create policy "admins read custom requests"
on public.custom_requests for select
to authenticated
using (public.is_admin());

drop policy if exists "admins update custom requests" on public.custom_requests;
create policy "admins update custom requests"
on public.custom_requests for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

create table if not exists public.contact_messages (
  id text primary key check (char_length(id) between 4 and 80),
  payload jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists contact_messages_created_idx on public.contact_messages (created_at desc);
alter table public.contact_messages enable row level security;
grant insert on public.contact_messages to anon, authenticated;
grant select on public.contact_messages to authenticated;

drop policy if exists "visitors create contact messages" on public.contact_messages;
create policy "visitors create contact messages"
on public.contact_messages for insert
to anon, authenticated
with check (jsonb_typeof(payload) = 'object');

drop policy if exists "admins read contact messages" on public.contact_messages;
create policy "admins read contact messages"
on public.contact_messages for select
to authenticated
using (public.is_admin());

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'product-images',
  'product-images',
  true,
  8388608,
  array['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/avif']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "product images are public" on storage.objects;
create policy "product images are public"
on storage.objects for select
to anon, authenticated
using (bucket_id = 'product-images');

drop policy if exists "admins upload product images" on storage.objects;
create policy "admins upload product images"
on storage.objects for insert
to authenticated
with check (bucket_id = 'product-images' and public.is_admin());

drop policy if exists "admins update product images" on storage.objects;
create policy "admins update product images"
on storage.objects for update
to authenticated
using (bucket_id = 'product-images' and public.is_admin())
with check (bucket_id = 'product-images' and public.is_admin());

drop policy if exists "admins delete product images" on storage.objects;
create policy "admins delete product images"
on storage.objects for delete
to authenticated
using (bucket_id = 'product-images' and public.is_admin());

-- After creating the first user in Authentication > Users, grant access once:
-- insert into public.admin_users (user_id)
-- select id from auth.users where email = 'owner@example.com';
