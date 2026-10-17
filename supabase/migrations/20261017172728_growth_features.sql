-- MILD: stock, galleries, customer contact details, ranked search, order numbers.
alter table public.products add column images text[] not null default '{}';
alter table public.products add column stock integer not null default 0 check(stock>=0);
alter table public.products add column low_stock_threshold integer not null default 5 check(low_stock_threshold>=0);
alter table public.products add column search_document tsvector generated always as (
 setweight(to_tsvector('english',name),'A') || setweight(to_tsvector('english',description),'B') || setweight(to_tsvector('english',category),'C')
) stored;
create index products_search on public.products using gin(search_document);
alter table public.profiles add column phone text not null default '';
alter table public.profiles add column address jsonb not null default '{}';
grant update(phone,address) on public.profiles to authenticated;
alter table public.orders add column order_number bigint generated always as identity(start with 1001) unique;
alter table public.orders add column stock_deducted boolean not null default false;
alter table public.orders drop constraint orders_status_check;
alter table public.orders add constraint orders_status_check check(status in('pending','processing','shipped','delivered','cancelled','on_hold'));
grant usage,select on all sequences in schema public to service_role;

create function public.search_products(p_query text,p_category text) returns setof public.products
language sql stable security invoker set search_path='' as $$
 select * from public.products p where p.active and (p_category='' or p.category=p_category)
 and (p_query='' or p.search_document @@ websearch_to_tsquery('english',left(p_query,100)) or p.name ilike '%'||replace(replace(replace(left(p_query,100),'%',''),'_',''),'\','')||'%')
 order by ts_rank(p.search_document,websearch_to_tsquery('english',left(p_query,100))) desc,p.featured desc,p.created_at desc,p.id;
$$;
revoke all on function public.search_products(text,text) from public;
grant execute on function public.search_products(text,text) to anon,authenticated,service_role;

-- Lock every product in stable order before checking stock. Payment settlement
-- never makes stock negative. If a competing buyer got the last item, preserve
-- the successful payment and flag on_hold for restocking/refund, never fake failure.
create function private.allocate_stock(p_order uuid) returns boolean language plpgsql security invoker set search_path='' as $$
declare enough boolean;
begin
 perform p.id from public.products p join public.order_items i on i.product_id=p.id where i.order_id=p_order order by p.id for update of p;
 select not exists(select 1 from public.order_items i left join public.products p on p.id=i.product_id where i.order_id=p_order and (p.id is null or p.stock<i.quantity)) into enough;
 if not enough then return false; end if;
 perform set_config('app.reason','order '||p_order::text,true);
 update public.products p set stock=p.stock-i.quantity from public.order_items i where i.order_id=p_order and i.product_id=p.id;
 return true;
end; $$;
revoke all on function private.allocate_stock(uuid) from public,anon,authenticated;
grant execute on function private.allocate_stock(uuid) to service_role;

create or replace function public.complete_payment(p_reference text,p_amount integer,p_currency text,p_transaction text)
returns public.orders language plpgsql security invoker set search_path='' as $$
declare result public.orders; allocated boolean;
begin
 select * into result from public.orders where reference=p_reference for update;
 if not found or result.total<>p_amount or result.currency<>p_currency then raise exception 'Payment mismatch'; end if;
 if result.payment_status='paid' then
  if result.paystack_id<>p_transaction then raise exception 'Transaction mismatch'; end if;
  return result;
 end if;
 allocated:=private.allocate_stock(result.id);
 update public.orders set payment_status='paid',status=case when allocated then 'processing' else 'on_hold' end,stock_deducted=allocated,paid_at=now(),paystack_id=p_transaction where id=result.id returning * into result;
 insert into public.email_outbox(order_id,kind) values(result.id,'payment_confirmed') on conflict do nothing;
 return result;
end; $$;

create or replace function public.change_order_status(p_order uuid,p_status text)
returns public.orders language plpgsql security invoker set search_path='' as $$
declare result public.orders;
begin
 select * into result from public.orders where id=p_order for update;
 if not found then raise exception 'Order missing'; end if;
 if result.status=p_status then return result; end if;
 if result.status='on_hold' and p_status='processing' and result.payment_status='paid' then
  if not private.allocate_stock(p_order) then raise exception 'Insufficient stock'; end if;
  update public.orders set stock_deducted=true where id=p_order;
 elsif not ((result.payment_status='paid' and ((result.status='processing' and p_status='shipped') or (result.status='shipped' and p_status='delivered'))) or (result.payment_status='pending' and result.status='pending' and p_status='cancelled')) then raise exception 'Invalid status transition';
 end if;
 update public.orders set status=p_status where id=p_order returning * into result;
 if p_status in('processing','shipped','delivered') then insert into public.email_outbox(order_id,kind) values(result.id,p_status) on conflict do nothing; end if;
 return result;
end; $$;

create or replace function public.create_checkout(p_user uuid,p_email text,p_lines jsonb,p_address jsonb,p_key uuid,p_hash text,p_currency text)
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
    if not found or product.stock < item.qty then raise exception 'Product unavailable or insufficient stock'; end if;
    total := total + product.price::bigint * item.qty;
  end loop;
  if total not between 1 and 2000000000 then raise exception 'Invalid total'; end if;
  insert into public.orders(id,user_id,email,reference,total,currency,shipping_address,idempotency_key,request_hash)
    values(order_id,p_user,p_email,'mulaba_'||order_id::text,total,p_currency,p_address,p_key,p_hash) returning * into result;
  insert into public.order_items(order_id,product_id,name,quantity,unit_price)
    select order_id,p.id,p.name,(x->>'quantity')::int,p.price from jsonb_array_elements(p_lines) x join public.products p on p.id=(x->>'product_id')::uuid;
  return result;
end; $$;
