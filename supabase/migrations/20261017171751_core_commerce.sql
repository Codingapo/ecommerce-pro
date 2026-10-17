-- BASIC: identity, catalog, orders, payment integrity and transactional mail.
-- Apply to a fresh Supabase project. All money values are integer minor units.
create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated, service_role;

create table public.accounts (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'customer' check (role in ('customer','admin'))
);
create table public.profiles (
  id uuid primary key references public.accounts(user_id) on delete cascade,
  email text not null,
  full_name text not null default '',
  created_at timestamptz not null default now()
);
create table public.categories (slug text primary key, name text not null);
create table public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 140),
  slug text unique not null check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  description text not null,
  category text not null references public.categories(slug),
  price integer not null check (price between 100 and 100000000),
  image_url text not null,
  active boolean not null default false,
  featured boolean not null default false,
  created_at timestamptz not null default now()
);
create table public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.accounts(user_id),
  reference text unique not null,
  status text not null default 'pending' check (status in ('pending','processing','shipped','delivered','cancelled')),
  payment_status text not null default 'pending' check (payment_status in ('pending','paid')),
  total integer not null check (total > 0),
  currency text not null check (currency = 'ZAR'),
  email text not null,
  shipping_address jsonb not null,
  created_at timestamptz not null default now(),
  paid_at timestamptz,
  idempotency_key uuid not null,
  request_hash text not null,
  authorization_url text,
  paystack_id text unique,
  unique(user_id, idempotency_key)
);
create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  name text not null,
  quantity integer not null check (quantity between 1 and 20),
  unit_price integer not null check (unit_price > 0)
);
create table public.email_outbox (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  kind text not null,
  sent_at timestamptz,
  attempts integer not null default 0,
  lease_until timestamptz,
  created_at timestamptz not null default now(),
  unique(order_id, kind)
);
create table private.rate_limits (key text primary key, window_start timestamptz not null, hits integer not null);

alter table public.accounts enable row level security;
alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.email_outbox enable row level security;
alter table private.rate_limits enable row level security;

-- A narrow private authorization lookup avoids recursive accounts policies.
-- Roles are never read from user-editable auth metadata.
create function private.is_admin() returns boolean language sql stable security definer set search_path = '' as $$
  select auth.uid() is not null and exists(select 1 from public.accounts where user_id = auth.uid() and role = 'admin');
$$;
revoke all on function private.is_admin() from public, anon;
grant execute on function private.is_admin() to authenticated, service_role;

-- This trigger has no exposed API. NEW.id comes exclusively from auth.users.
create function private.new_account() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if TG_TABLE_SCHEMA <> 'auth' or TG_TABLE_NAME <> 'users' or TG_OP <> 'INSERT' then raise exception 'Invalid trigger context'; end if;
  insert into public.accounts(user_id) values (new.id);
  insert into public.profiles(id,email,full_name) values(new.id,coalesce(new.email,''),left(coalesce(new.raw_user_meta_data->>'full_name',''),100));
  return new;
end; $$;
revoke all on function private.new_account() from public, anon, authenticated;
create trigger on_auth_user_created after insert on auth.users for each row execute function private.new_account();

create policy accounts_read on public.accounts for select to authenticated using (user_id = (select auth.uid()) or (select private.is_admin()));
create policy profiles_read on public.profiles for select to authenticated using (id = (select auth.uid()) or (select private.is_admin()));
create policy profiles_update on public.profiles for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));
create policy categories_read on public.categories for select to anon, authenticated using (true);
create policy products_read on public.products for select to anon, authenticated using (active);
create policy products_admin_read on public.products for select to authenticated using ((select private.is_admin()));
create policy orders_read on public.orders for select to authenticated using (user_id = (select auth.uid()) or (select private.is_admin()));
create policy order_items_read on public.order_items for select to authenticated using (exists(select 1 from public.orders o where o.id = order_id and (o.user_id = (select auth.uid()) or (select private.is_admin()))));
-- No browser INSERT/UPDATE/DELETE grants on products, roles, orders or mail.
revoke all on public.accounts,public.profiles,public.categories,public.products,public.orders,public.order_items,public.email_outbox from anon, authenticated;
grant select on public.categories, public.products to anon, authenticated;
grant select on public.accounts,public.profiles,public.orders,public.order_items to authenticated;
grant update(full_name) on public.profiles to authenticated;
grant all on all tables in schema public to service_role;
grant all on private.rate_limits to service_role;

create index orders_user_created on public.orders(user_id, created_at desc);
create index orders_paid_created on public.orders(payment_status,created_at);
create index items_order on public.order_items(order_id);
create index items_product on public.order_items(product_id);
create index products_category on public.products(category,active);
create index email_pending on public.email_outbox(created_at) where sent_at is null;

-- All business RPCs are SECURITY INVOKER and exclusively service_role callable.
create function public.create_checkout(p_user uuid,p_email text,p_lines jsonb,p_address jsonb,p_key uuid,p_hash text,p_currency text)
returns public.orders language plpgsql security invoker set search_path = '' as $$
declare result public.orders; item record; product public.products; total bigint := 0; order_id uuid := gen_random_uuid(); n integer;
begin
  perform pg_advisory_xact_lock(hashtextextended(p_user::text || p_key::text,0));
  select * into result from public.orders where user_id=p_user and idempotency_key=p_key;
  if found then
    if result.request_hash <> p_hash then raise exception 'Idempotency key reused with different cart'; end if;
    if result.status='cancelled' then raise exception 'Checkout cancelled'; end if;
    return result;
  end if;
  if jsonb_typeof(p_lines) <> 'array' or jsonb_array_length(p_lines) not between 1 and 50 then raise exception 'Invalid cart'; end if;
  select count(distinct x->>'product_id') into n from jsonb_array_elements(p_lines) x;
  if n <> jsonb_array_length(p_lines) then raise exception 'Duplicate items'; end if;
  for item in select (x->>'product_id')::uuid id,(x->>'quantity')::int qty from jsonb_array_elements(p_lines) x order by (x->>'product_id')::uuid loop
    if item.qty is null or item.qty not between 1 and 20 then raise exception 'Invalid quantity'; end if;
    select * into product from public.products where id=item.id and active for share;
    if not found then raise exception 'Product unavailable'; end if;
    total := total + product.price::bigint * item.qty;
  end loop;
  if total not between 1 and 2000000000 then raise exception 'Invalid total'; end if;
  insert into public.orders(id,user_id,email,reference,total,currency,shipping_address,idempotency_key,request_hash)
    values(order_id,p_user,p_email,'mulaba_'||order_id::text,total,p_currency,p_address,p_key,p_hash) returning * into result;
  insert into public.order_items(order_id,product_id,name,quantity,unit_price)
    select order_id,p.id,p.name,(x->>'quantity')::int,p.price from jsonb_array_elements(p_lines) x join public.products p on p.id=(x->>'product_id')::uuid;
  return result;
end; $$;

create function public.complete_payment(p_reference text,p_amount integer,p_currency text,p_transaction text)
returns public.orders language plpgsql security invoker set search_path = '' as $$
declare result public.orders;
begin
  select * into result from public.orders where reference=p_reference for update;
  if not found or result.total <> p_amount or result.currency <> p_currency then raise exception 'Payment mismatch'; end if;
  if result.payment_status='paid' then
    if result.paystack_id <> p_transaction then raise exception 'Transaction mismatch'; end if;
    return result;
  end if;
  update public.orders set payment_status='paid',status='processing',paid_at=now(),paystack_id=p_transaction where id=result.id returning * into result;
  insert into public.email_outbox(order_id,kind) values(result.id,'payment_confirmed') on conflict do nothing;
  return result;
end; $$;

create function public.change_order_status(p_order uuid,p_status text)
returns public.orders language plpgsql security invoker set search_path = '' as $$
declare result public.orders;
begin
  select * into result from public.orders where id=p_order for update;
  if not found then raise exception 'Order missing'; end if;
  if result.status=p_status then return result; end if;
  if not ((result.payment_status='paid' and ((result.status='processing' and p_status='shipped') or (result.status='shipped' and p_status='delivered'))) or (result.payment_status='pending' and result.status='pending' and p_status='cancelled')) then raise exception 'Invalid status transition'; end if;
  update public.orders set status=p_status where id=p_order returning * into result;
  return result;
end; $$;

create function public.consume_limit(p_key text,p_max integer,p_seconds integer)
returns boolean language plpgsql security invoker set search_path = '' as $$
declare hits integer;
begin
  delete from private.rate_limits where window_start < now()-interval '1 day';
  insert into private.rate_limits(key,window_start,hits) values(p_key,now(),1)
  on conflict(key) do update set hits=case when private.rate_limits.window_start < now()-make_interval(secs=>p_seconds) then 1 else private.rate_limits.hits+1 end,
    window_start=case when private.rate_limits.window_start < now()-make_interval(secs=>p_seconds) then now() else private.rate_limits.window_start end
  returning private.rate_limits.hits into hits;
  return hits<=p_max;
end; $$;

create function public.claim_emails(p_limit integer) returns setof public.email_outbox language sql security invoker set search_path = '' as $$
  update public.email_outbox set attempts=attempts+1,lease_until=now()+interval '10 minutes'
  where id in (select id from public.email_outbox where sent_at is null and (lease_until is null or lease_until<now()) and attempts<10 order by created_at for update skip locked limit least(p_limit,50)) returning *;
$$;
revoke all on function public.create_checkout(uuid,text,jsonb,jsonb,uuid,text,text),public.complete_payment(text,integer,text,text),public.change_order_status(uuid,text),public.consume_limit(text,integer,integer),public.claim_emails(integer) from public,anon,authenticated;
grant execute on function public.create_checkout(uuid,text,jsonb,jsonb,uuid,text,text),public.complete_payment(text,integer,text,text),public.change_order_status(uuid,text),public.consume_limit(text,integer,integer),public.claim_emails(integer) to service_role;
insert into public.categories(slug,name) values('furniture','Furniture'),('lighting','Lighting'),('living','Living'),('essentials','Essentials');

-- Keep account contact email aligned with verified Auth email changes.
create function private.sync_account_email() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if TG_TABLE_SCHEMA<>'auth' or TG_TABLE_NAME<>'users' or TG_OP<>'UPDATE' then raise exception 'Invalid trigger context'; end if;
 if old.email is distinct from new.email then update public.profiles set email=coalesce(new.email,'') where id=new.id; end if;
 return new;
end;$$;
revoke all on function private.sync_account_email() from public,anon,authenticated;
create trigger on_auth_email_updated after update of email on auth.users for each row execute function private.sync_account_email();
