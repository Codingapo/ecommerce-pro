-- PRO: consent-aware analytics, reviews, wishlists, coupons, inventory history,
-- activity logs and opt-in abandoned cart recovery. No session recordings.
alter table public.profiles add column recovery_opt_in boolean not null default false;
grant update(recovery_opt_in) on public.profiles to authenticated;
alter table public.orders add column subtotal integer;
update public.orders set subtotal=total;
alter table public.orders alter column subtotal set not null;
alter table public.orders add column discount integer not null default 0 check(discount>=0);
alter table public.orders add column coupon_code text;
alter table public.orders add column analytics_session uuid;
alter table public.orders add column traffic_source text not null default 'direct';
alter table public.orders add constraint total_matches_discount check(total=subtotal-discount);

create table public.wishlists(user_id uuid not null references public.accounts(user_id) on delete cascade,product_id uuid not null references public.products(id) on delete cascade,created_at timestamptz not null default now(),primary key(user_id,product_id));
create table public.reviews(id uuid primary key default gen_random_uuid(),user_id uuid not null references public.accounts(user_id) on delete cascade,product_id uuid not null references public.products(id) on delete cascade,rating integer not null check(rating between 1 and 5),body text not null check(char_length(body) between 10 and 2000),created_at timestamptz not null default now(),unique(user_id,product_id));
create table public.coupons(id uuid primary key default gen_random_uuid(),code text unique not null check(code ~ '^[A-Z0-9_-]{3,32}$'),percent integer not null check(percent between 1 and 90),min_subtotal integer not null default 0 check(min_subtotal>=0),expires_at timestamptz not null,active boolean not null default true,created_at timestamptz not null default now());
create table public.events(id uuid primary key default gen_random_uuid(),session_id uuid not null,user_id uuid references public.accounts(user_id) on delete set null,kind text not null check(kind in('page_view','product_view','add_to_cart','checkout_started','purchase_completed')),product_id uuid references public.products(id) on delete set null,order_id uuid references public.orders(id) on delete set null,source text not null default 'direct' check(char_length(source)<=100),path text not null default '/' check(char_length(path)<=250),created_at timestamptz not null default now(),unique(order_id,kind));
create table public.inventory_history(id uuid primary key default gen_random_uuid(),product_id uuid references public.products(id) on delete set null,product_name text not null,delta integer not null,stock_after integer not null,reason text not null,actor_id uuid references public.accounts(user_id) on delete set null,created_at timestamptz not null default now());
create table public.activity_logs(id uuid primary key default gen_random_uuid(),actor_id uuid references public.accounts(user_id) on delete set null,action text not null,entity text not null,entity_id text not null,created_at timestamptz not null default now());
create table public.carts(user_id uuid primary key references public.accounts(user_id) on delete cascade,items jsonb not null default '[]',updated_at timestamptz not null default now(),last_reminded_at timestamptz,recovery_lease timestamptz);

alter table public.wishlists enable row level security;
alter table public.reviews enable row level security;
alter table public.coupons enable row level security;
alter table public.events enable row level security;
alter table public.inventory_history enable row level security;
alter table public.activity_logs enable row level security;
alter table public.carts enable row level security;
create policy wishlist_read on public.wishlists for select to authenticated using(user_id=(select auth.uid()));
create policy wishlist_insert on public.wishlists for insert to authenticated with check(user_id=(select auth.uid()));
create policy wishlist_delete on public.wishlists for delete to authenticated using(user_id=(select auth.uid()));
create policy reviews_read on public.reviews for select to anon,authenticated using(true);
create policy reviews_verified on public.reviews for insert to authenticated with check(user_id=(select auth.uid()) and exists(select 1 from public.order_items i join public.orders o on o.id=i.order_id where i.product_id=reviews.product_id and o.user_id=(select auth.uid()) and o.payment_status='paid'));
create policy reviews_edit on public.reviews for update to authenticated using(user_id=(select auth.uid())) with check(user_id=(select auth.uid()));
create policy reviews_delete on public.reviews for delete to authenticated using(user_id=(select auth.uid()));
create policy coupons_admin on public.coupons for select to authenticated using((select private.is_admin()));
create policy events_admin on public.events for select to authenticated using((select private.is_admin()));
create policy inventory_admin on public.inventory_history for select to authenticated using((select private.is_admin()));
create policy activity_admin on public.activity_logs for select to authenticated using((select private.is_admin()));
create policy carts_owner on public.carts for select to authenticated using(user_id=(select auth.uid()));
revoke all on public.wishlists,public.reviews,public.coupons,public.events,public.inventory_history,public.activity_logs,public.carts from anon,authenticated;
grant select,insert,delete on public.wishlists to authenticated;
grant select on public.reviews to anon,authenticated;
grant insert,delete on public.reviews to authenticated;
grant update(rating,body) on public.reviews to authenticated;
grant select on public.coupons,public.events,public.inventory_history,public.activity_logs,public.carts to authenticated;
grant all on public.wishlists,public.reviews,public.coupons,public.events,public.inventory_history,public.activity_logs,public.carts to service_role;
create index wishlist_product on public.wishlists(product_id);
create index reviews_product on public.reviews(product_id,created_at desc);
create index events_created_session on public.events(created_at,session_id);
create index events_user on public.events(user_id);
create index events_product on public.events(product_id);
create index inventory_product on public.inventory_history(product_id,created_at desc);
create index inventory_actor on public.inventory_history(actor_id);
create index activity_actor on public.activity_logs(actor_id,created_at desc);
create index carts_recovery on public.carts(updated_at) where last_reminded_at is null;

-- Database triggers keep inventory and admin audit records transactional.
create function private.product_audit() returns trigger language plpgsql security invoker set search_path='' as $$
declare actor uuid := nullif(current_setting('app.actor',true),'')::uuid; reason text := coalesce(nullif(current_setting('app.reason',true),''),'stock adjustment');
begin
 if TG_OP='INSERT' then
  insert into public.inventory_history(product_id,product_name,delta,stock_after,reason,actor_id) values(new.id,new.name,new.stock,new.stock,reason,actor);
 elsif TG_OP='UPDATE' and old.stock<>new.stock then
  insert into public.inventory_history(product_id,product_name,delta,stock_after,reason,actor_id) values(new.id,new.name,new.stock-old.stock,new.stock,reason,actor);
 end if;
 insert into public.activity_logs(actor_id,action,entity,entity_id) values(actor,lower(TG_OP),'product',case when TG_OP='DELETE' then old.id::text else new.id::text end);
 return coalesce(new,old);
end; $$;
revoke all on function private.product_audit() from public,anon,authenticated;
create trigger product_audit after insert or update or delete on public.products for each row execute function private.product_audit();

create function private.order_events() returns trigger language plpgsql security invoker set search_path='' as $$
begin
 if old.payment_status<>'paid' and new.payment_status='paid' then
  if new.analytics_session is not null then insert into public.events(session_id,user_id,kind,order_id,source,path) values(new.analytics_session,new.user_id,'purchase_completed',new.id,new.traffic_source,'/checkout/return') on conflict do nothing; end if;
  delete from public.carts c where c.user_id=new.user_id and c.items=(select jsonb_agg(jsonb_build_object('product_id',i.product_id::text,'quantity',i.quantity) order by i.product_id) from public.order_items i where i.order_id=new.id);
 end if;
 if old.status<>new.status or old.payment_status<>new.payment_status then insert into public.activity_logs(actor_id,action,entity,entity_id) values(nullif(current_setting('app.actor',true),'')::uuid,'status:'||new.status,'order',new.id::text); end if;
 return new;
end; $$;
revoke all on function private.order_events() from public,anon,authenticated;
create trigger order_events after update on public.orders for each row execute function private.order_events();

create function public.save_product(p_id uuid,p_data jsonb,p_expected_stock integer,p_actor uuid) returns public.products language plpgsql security invoker set search_path='' as $$
declare result public.products;
begin
 perform set_config('app.actor',p_actor::text,true);perform set_config('app.reason','admin adjustment',true);
 if p_id is not null then
  select * into result from public.products where id=p_id for update;
  if not found or result.stock<>p_expected_stock then raise exception 'Product changed. Refresh before saving.';end if;
  update public.products set name=p_data->>'name',slug=p_data->>'slug',description=p_data->>'description',category=p_data->>'category',price=(p_data->>'price')::integer,image_url=p_data->>'image_url',images=array(select jsonb_array_elements_text(p_data->'images')),stock=(p_data->>'stock')::integer,low_stock_threshold=(p_data->>'low_stock_threshold')::integer,active=(p_data->>'active')::boolean,featured=(p_data->>'featured')::boolean where id=p_id returning * into result;
 else
  insert into public.products(name,slug,description,category,price,image_url,images,stock,low_stock_threshold,active,featured) values(p_data->>'name',p_data->>'slug',p_data->>'description',p_data->>'category',(p_data->>'price')::integer,p_data->>'image_url',array(select jsonb_array_elements_text(p_data->'images')),(p_data->>'stock')::integer,(p_data->>'low_stock_threshold')::integer,(p_data->>'active')::boolean,(p_data->>'featured')::boolean) returning * into result;
 end if;
 return result;
end; $$;
create function public.delete_product(p_id uuid,p_actor uuid) returns void language plpgsql security invoker set search_path='' as $$begin perform set_config('app.actor',p_actor::text,true);delete from public.products where id=p_id;end;$$;
create function public.admin_order_status(p_order uuid,p_status text,p_actor uuid) returns public.orders language plpgsql security invoker set search_path='' as $$begin perform set_config('app.actor',p_actor::text,true);return public.change_order_status(p_order,p_status);end;$$;
create function public.save_coupon(p_id uuid,p_data jsonb,p_actor uuid) returns public.coupons language plpgsql security invoker set search_path='' as $$
declare result public.coupons;
begin
 insert into public.coupons(id,code,percent,min_subtotal,expires_at,active) values(coalesce(p_id,gen_random_uuid()),p_data->>'code',(p_data->>'percent')::integer,(p_data->>'min_subtotal')::integer,(p_data->>'expires_at')::timestamptz,(p_data->>'active')::boolean)
 on conflict(id) do update set code=excluded.code,percent=excluded.percent,min_subtotal=excluded.min_subtotal,expires_at=excluded.expires_at,active=excluded.active returning * into result;
 insert into public.activity_logs(actor_id,action,entity,entity_id) values(p_actor,'save','coupon',result.id::text);
 return result;
end; $$;
create function public.save_cart(p_user uuid,p_items jsonb) returns void language plpgsql security invoker set search_path='' as $$
begin
 if jsonb_array_length(p_items)>50 then raise exception 'Cart too large'; end if;
 insert into public.carts(user_id,items) values(p_user,p_items) on conflict(user_id) do update set items=excluded.items,updated_at=now(),last_reminded_at=null,recovery_lease=null where public.carts.items is distinct from excluded.items;
end; $$;
create function public.claim_recovery_carts() returns setof public.carts language sql security invoker set search_path='' as $$
 update public.carts set recovery_lease=now()+interval '10 minutes'
 where user_id in(select c.user_id from public.carts c join public.profiles p on p.id=c.user_id where p.recovery_opt_in and c.items<>'[]'::jsonb and c.updated_at<now()-interval '24 hours' and c.updated_at>now()-interval '14 days' and c.last_reminded_at is null and (c.recovery_lease is null or c.recovery_lease<now()) and not exists(select 1 from public.orders o where o.user_id=c.user_id and o.paid_at>=c.updated_at) order by c.updated_at for update of c skip locked limit 30) returning *;
$$;
revoke all on function public.save_product(uuid,jsonb,integer,uuid),public.delete_product(uuid,uuid),public.admin_order_status(uuid,text,uuid),public.save_coupon(uuid,jsonb,uuid),public.save_cart(uuid,jsonb),public.claim_recovery_carts() from public,anon,authenticated;
grant execute on function public.save_product(uuid,jsonb,integer,uuid),public.delete_product(uuid,uuid),public.admin_order_status(uuid,text,uuid),public.save_coupon(uuid,jsonb,uuid),public.save_cart(uuid,jsonb),public.claim_recovery_carts() to service_role;

drop function public.create_checkout(uuid,text,jsonb,jsonb,uuid,text,text);
create function public.create_checkout(p_user uuid,p_email text,p_lines jsonb,p_address jsonb,p_key uuid,p_hash text,p_currency text,p_coupon text,p_session uuid,p_source text)
returns public.orders language plpgsql security invoker set search_path = '' as $$
declare result public.orders; item record; product public.products; total bigint := 0; order_id uuid := gen_random_uuid(); n integer; coupon public.coupons; discount integer := 0;
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
    if not found or product.stock < item.qty then raise exception 'Product unavailable or insufficient stock'; end if;
    total := total + product.price::bigint * item.qty;
  end loop;
  if total not between 1 and 2000000000 then raise exception 'Invalid total'; end if;
  if p_coupon<>'' then
    select * into coupon from public.coupons where code=upper(p_coupon) and active and expires_at>now() for share;
    if not found or total<coupon.min_subtotal then raise exception 'Coupon invalid, expired, or minimum spend not met'; end if;
    discount:=floor(total*coupon.percent/100.0)::integer;
  end if;
  insert into public.orders(id,user_id,email,reference,total,subtotal,discount,coupon_code,analytics_session,traffic_source,currency,shipping_address,idempotency_key,request_hash)
    values(order_id,p_user,p_email,'mulaba_'||order_id::text,total-discount,total,discount,nullif(p_coupon,''),p_session,left(p_source,100),p_currency,p_address,p_key,p_hash) returning * into result;
  insert into public.order_items(order_id,product_id,name,quantity,unit_price)
    select order_id,p.id,p.name,(x->>'quantity')::int,p.price from jsonb_array_elements(p_lines) x join public.products p on p.id=(x->>'product_id')::uuid;
  if p_session is not null then insert into public.events(session_id,user_id,kind,order_id,source,path) values(p_session,p_user,'checkout_started',result.id,left(p_source,100),'/checkout') on conflict do nothing; end if;
  return result;
end; $$;

revoke all on function public.create_checkout(uuid,text,jsonb,jsonb,uuid,text,text,text,uuid,text) from public,anon,authenticated;
grant execute on function public.create_checkout(uuid,text,jsonb,jsonb,uuid,text,text,text,uuid,text) to service_role;
