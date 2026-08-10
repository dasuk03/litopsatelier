-- Litops Atelier backend for Neon Auth and the Neon Data API.
-- Products and legal documents are public when published. All writes are
-- protected by Neon Auth, PostgreSQL privileges, and row-level security.

create extension if not exists pgcrypto;

grant usage on schema public to anonymous, authenticated;

create table if not exists public.admin_users (
  user_id uuid primary key references neon_auth."user"(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.admin_invites (
  token_hash text primary key check (char_length(token_hash) = 64),
  expires_at timestamptz not null,
  used_at timestamptz,
  used_by uuid references neon_auth."user"(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.admin_users enable row level security;
alter table public.admin_invites enable row level security;
revoke all on public.admin_users from anonymous, authenticated;
revoke all on public.admin_invites from anonymous, authenticated;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.admin_users
    where user_id::text = auth.user_id()
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anonymous, authenticated;

create or replace function public.claim_admin(invite_token text)
returns boolean
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  current_user_id uuid;
  claimed boolean := false;
begin
  current_user_id := nullif(auth.user_id(), '')::uuid;
  if current_user_id is null then
    return false;
  end if;

  if exists (
    select 1 from public.admin_users where user_id = current_user_id
  ) then
    return true;
  end if;

  if invite_token is null or char_length(invite_token) < 20 then
    return false;
  end if;

  update public.admin_invites
  set used_at = pg_catalog.now(), used_by = current_user_id
  where token_hash = pg_catalog.encode(public.digest(invite_token, 'sha256'), 'hex')
    and used_at is null
    and expires_at > pg_catalog.now()
  returning true into claimed;

  if coalesce(claimed, false) then
    insert into public.admin_users (user_id)
    values (current_user_id)
    on conflict (user_id) do nothing;
    return true;
  end if;

  return false;
end;
$$;

revoke all on function public.claim_admin(text) from public;
grant execute on function public.claim_admin(text) to authenticated;

create table if not exists public.store_products (
  id text primary key check (char_length(id) between 2 and 100),
  data jsonb not null,
  published boolean not null default true,
  sort_order integer not null default 0 check (sort_order >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint store_products_data_object check (
    jsonb_typeof(data) = 'object'
    and char_length(coalesce(data ->> 'name', '')) between 1 and 180
    and octet_length(data::text) <= 500000
  )
);

create index if not exists store_products_public_order_idx
on public.store_products (published, sort_order);

create table if not exists public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id text not null references public.store_products(id) on delete cascade,
  content_type text not null check (content_type in ('image/jpeg', 'image/png', 'image/webp', 'image/avif')),
  data_uri text not null check (
    data_uri like 'data:image/%;base64,%'
    and char_length(data_uri) <= 5000000
  ),
  size_bytes integer not null check (size_bytes between 1 and 4000000),
  width integer check (width between 1 and 8000),
  height integer check (height between 1 and 8000),
  sort_order integer not null default 0 check (sort_order >= 0),
  uploaded_by uuid references neon_auth."user"(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists product_images_product_order_idx
on public.product_images (product_id, sort_order, created_at);

create table if not exists public.legal_documents (
  slug text primary key check (char_length(slug) between 2 and 100),
  title text not null check (char_length(title) between 2 and 250),
  summary text not null default '' check (char_length(summary) <= 1000),
  body text not null check (char_length(body) between 1 and 500000),
  published boolean not null default true,
  sort_order integer not null default 0 check (sort_order >= 0),
  updated_at timestamptz not null default now()
);

create table if not exists public.store_orders (
  id text primary key check (char_length(id) between 4 and 80),
  payload jsonb not null,
  status text not null default 'Новый' check (status in ('Новый', 'Подтверждён', 'В работе', 'Завершён')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint store_orders_payload_valid check (
    jsonb_typeof(payload) = 'object'
    and char_length(coalesce(payload #>> '{customer,name}', '')) between 1 and 160
    and char_length(coalesce(payload #>> '{customer,phone}', '')) between 5 and 60
    and jsonb_typeof(payload -> 'items') = 'array'
    and jsonb_array_length(payload -> 'items') between 1 and 100
    and octet_length(payload::text) <= 150000
  )
);

create index if not exists store_orders_created_idx
on public.store_orders (created_at desc);

create table if not exists public.custom_requests (
  id text primary key check (char_length(id) between 4 and 80),
  payload jsonb not null,
  status text not null default 'Новая' check (status in ('Новая', 'В работе', 'Выполнена', 'Отменена')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint custom_requests_payload_valid check (
    jsonb_typeof(payload) = 'object'
    and char_length(coalesce(payload ->> 'name', '')) between 1 and 160
    and char_length(coalesce(payload ->> 'phone', '')) between 5 and 60
    and octet_length(payload::text) <= 150000
  )
);

create index if not exists custom_requests_created_idx
on public.custom_requests (created_at desc);

create table if not exists public.contact_messages (
  id text primary key check (char_length(id) between 4 and 80),
  payload jsonb not null,
  created_at timestamptz not null default now(),
  constraint contact_messages_payload_valid check (
    jsonb_typeof(payload) = 'object'
    and char_length(coalesce(payload ->> 'name', '')) between 1 and 160
    and char_length(coalesce(payload ->> 'message', '')) between 2 and 10000
    and octet_length(payload::text) <= 50000
  )
);

create index if not exists contact_messages_created_idx
on public.contact_messages (created_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := pg_catalog.now();
  return new;
end;
$$;

revoke all on function public.set_updated_at() from public;

drop trigger if exists store_products_set_updated_at on public.store_products;
create trigger store_products_set_updated_at
before update on public.store_products
for each row execute function public.set_updated_at();

drop trigger if exists store_orders_set_updated_at on public.store_orders;
create trigger store_orders_set_updated_at
before update on public.store_orders
for each row execute function public.set_updated_at();

drop trigger if exists custom_requests_set_updated_at on public.custom_requests;
create trigger custom_requests_set_updated_at
before update on public.custom_requests
for each row execute function public.set_updated_at();

alter table public.store_products enable row level security;
alter table public.product_images enable row level security;
alter table public.legal_documents enable row level security;
alter table public.store_orders enable row level security;
alter table public.custom_requests enable row level security;
alter table public.contact_messages enable row level security;

grant select on public.store_products, public.product_images, public.legal_documents
to anonymous, authenticated;
grant insert on public.store_orders, public.custom_requests, public.contact_messages
to anonymous, authenticated;
grant insert, update, delete on public.store_products, public.product_images, public.legal_documents
to authenticated;
grant select, update, delete on public.store_orders, public.custom_requests, public.contact_messages
to authenticated;

drop policy if exists "published products are public" on public.store_products;
create policy "published products are public"
on public.store_products for select
to anonymous, authenticated
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

drop policy if exists "published product images are public" on public.product_images;
create policy "published product images are public"
on public.product_images for select
to anonymous, authenticated
using (
  public.is_admin()
  or exists (
    select 1 from public.store_products
    where store_products.id = product_images.product_id
      and store_products.published
  )
);

drop policy if exists "admins insert product images" on public.product_images;
create policy "admins insert product images"
on public.product_images for insert
to authenticated
with check (
  public.is_admin()
  and uploaded_by::text = auth.user_id()
);

drop policy if exists "admins update product images" on public.product_images;
create policy "admins update product images"
on public.product_images for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "admins delete product images" on public.product_images;
create policy "admins delete product images"
on public.product_images for delete
to authenticated
using (public.is_admin());

drop policy if exists "published legal documents are public" on public.legal_documents;
create policy "published legal documents are public"
on public.legal_documents for select
to anonymous, authenticated
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

drop policy if exists "visitors create orders" on public.store_orders;
create policy "visitors create orders"
on public.store_orders for insert
to anonymous, authenticated
with check (status = 'Новый');

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

drop policy if exists "admins delete orders" on public.store_orders;
create policy "admins delete orders"
on public.store_orders for delete
to authenticated
using (public.is_admin());

drop policy if exists "visitors create custom requests" on public.custom_requests;
create policy "visitors create custom requests"
on public.custom_requests for insert
to anonymous, authenticated
with check (status = 'Новая');

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

drop policy if exists "admins delete custom requests" on public.custom_requests;
create policy "admins delete custom requests"
on public.custom_requests for delete
to authenticated
using (public.is_admin());

drop policy if exists "visitors create contact messages" on public.contact_messages;
create policy "visitors create contact messages"
on public.contact_messages for insert
to anonymous, authenticated
with check (true);

drop policy if exists "admins read contact messages" on public.contact_messages;
create policy "admins read contact messages"
on public.contact_messages for select
to authenticated
using (public.is_admin());

drop policy if exists "admins delete contact messages" on public.contact_messages;
create policy "admins delete contact messages"
on public.contact_messages for delete
to authenticated
using (public.is_admin());
