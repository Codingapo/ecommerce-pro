import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
const a = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
  b = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
  p = "11111111-1111-4111-8111-111111111111";
test("actual Postgres migrations enforce RLS, price authority and idempotent payment settlement", async () => {
  const db = new PGlite();
  await db.exec(
    `create role anon; create role authenticated; create role service_role bypassrls; create schema auth; create table auth.users(id uuid primary key,email text,raw_user_meta_data jsonb); create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$; grant usage on schema public,auth to anon,authenticated,service_role; grant execute on function auth.uid() to anon,authenticated,service_role;`,
  );
  for (const file of readdirSync("supabase/migrations")
    .filter((f) => f.endsWith(".sql"))
    .sort())
    await db.exec(readFileSync(`supabase/migrations/${file}`, "utf8"));
  await db.exec(
    `insert into auth.users values('${a}','a@example.com','{"role":"admin","full_name":"A"}'),('${b}','b@example.com','{}'); insert into public.products(id,name,slug,description,category,price,image_url,active) values('${p}','Chair','chair','A useful chair','furniture',50000,'https://example.com/chair.webp',true); insert into public.products(name,slug,description,category,price,image_url,active) values('Hidden','hidden','Hidden draft','furniture',10000,'https://example.com/x.webp',false);`,
  );
  await db.exec(`update public.products set stock=10`);
  const runAs = async (role: string, user: string, sql: string) => {
    await db.exec(
      `set role ${role}; select set_config('request.jwt.claim.sub','${user}',false);`,
    );
    try {
      return await db.query(sql);
    } finally {
      await db.exec("reset role");
    }
  };
  assert.equal(
    (await runAs("anon", "", `select * from public.products`)).rows.length,
    1,
  );
  assert.equal(
    (
      (await runAs("authenticated", a, `select role from public.accounts`))
        .rows[0] as { role: string }
    ).role,
    "customer",
  );
  await assert.rejects(
    runAs(
      "authenticated",
      a,
      `update public.accounts set role='admin' where user_id='${a}'`,
    ),
  );
  await assert.rejects(
    runAs(
      "authenticated",
      a,
      `update public.profiles set email='attacker@example.com' where id='${a}'`,
    ),
  );
  await assert.rejects(
    runAs(
      "authenticated",
      a,
      `select public.complete_payment('x',1,'ZAR','1')`,
    ),
  );
  const create = `select (public.create_checkout('${a}','a@example.com','[{"product_id":"${p}","quantity":2}]','{"name":"A"}','cccccccc-cccc-4ccc-8ccc-cccccccccccc','cart-hash','ZAR','',null,'direct')).*`;
  const order = (await runAs("service_role", "", create)).rows[0] as Record<
    string,
    unknown
  >;
  assert.equal(order.total, 100000);
  const repeated = (await runAs("service_role", "", create)).rows[0] as Record<
    string,
    unknown
  >;
  assert.equal(repeated.id, order.id);
  await assert.rejects(
    runAs("service_role", "", create.replace("cart-hash", "different-hash")),
  );
  assert.equal(
    (await runAs("authenticated", b, `select * from public.orders`)).rows
      .length,
    0,
  );
  assert.equal(
    (await runAs("authenticated", b, `select * from public.order_items`)).rows
      .length,
    0,
  );
  assert.equal(
    (await runAs("authenticated", a, `select * from public.orders`)).rows
      .length,
    1,
  );
  await assert.rejects(
    runAs(
      "authenticated",
      a,
      `update public.orders set payment_status='paid' where id='${order.id}'`,
    ),
  );
  await assert.rejects(
    runAs(
      "service_role",
      "",
      `select public.complete_payment('${order.reference}',1,'ZAR','123')`,
    ),
  );
  const complete = `select (public.complete_payment('${order.reference}',100000,'ZAR','123')).*`;
  const paid = (await runAs("service_role", "", complete)).rows[0] as Record<
    string,
    unknown
  >;
  assert.equal(paid.payment_status, "paid");
  assert.equal(paid.status, "processing");
  await runAs("service_role", "", complete);
  assert.equal(
    (await db.query("select * from public.email_outbox")).rows.length,
    1,
  );
  await assert.rejects(
    runAs(
      "service_role",
      "",
      `select public.complete_payment('${order.reference}',100000,'ZAR','different-transaction')`,
    ),
  );
  await assert.rejects(
    runAs(
      "service_role",
      "",
      `select public.change_order_status('${order.id}','delivered')`,
    ),
  );
  await runAs(
    "service_role",
    "",
    `select public.change_order_status('${order.id}','shipped')`,
  );
  assert.equal(
    (await runAs("service_role", "", `select * from public.claim_emails(10)`))
      .rows.length,
    2,
  );
  assert.equal(
    (await runAs("service_role", "", `select * from public.claim_emails(10)`))
      .rows.length,
    0,
  );
  await db.exec(`update public.accounts set role='admin' where user_id='${b}'`);
  assert.equal(
    (await runAs("authenticated", b, "select * from public.orders")).rows
      .length,
    1,
  );

  const stock = (
    await db.query<{ stock: number }>(
      `select stock from public.products where id='${p}'`,
    )
  ).rows[0].stock;
  assert.equal(stock, 8, "duplicate webhook must not decrement stock twice");
  const createSecond = create.replace(
    "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
    "dddddddd-dddd-4ddd-8ddd-dddddddddddd",
  );
  const second = (await runAs("service_role", "", createSecond))
    .rows[0] as Record<string, unknown>;
  await db.exec(`update public.products set stock=0 where id='${p}'`);
  const held = (
    await runAs(
      "service_role",
      "",
      `select (public.complete_payment('${second.reference}',100000,'ZAR','456')).*`,
    )
  ).rows[0] as Record<string, unknown>;
  assert.equal(held.payment_status, "paid");
  assert.equal(held.status, "on_hold");
  await assert.rejects(
    runAs(
      "service_role",
      "",
      `select public.change_order_status('${second.id}','processing')`,
    ),
  );
  await db.exec(`update public.products set stock=5 where id='${p}'`);
  await runAs(
    "service_role",
    "",
    `select public.change_order_status('${second.id}','processing')`,
  );
  assert.equal(
    (
      await db.query<{ stock: number }>(
        `select stock from public.products where id='${p}'`,
      )
    ).rows[0].stock,
    3,
  );

  // PRO: coupon prices are authoritative, reviews require a purchase and tracking is server-controlled.
  await db.exec(
    `insert into public.coupons(code,percent,min_subtotal,expires_at) values('WELCOME10',10,50000,now()+interval '1 day'),('EXPIRED',50,0,now()-interval '1 day'); update public.products set stock=20 where id='${p}';`,
  );
  const couponCheckout = create
    .replace(
      "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
      "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee",
    )
    .replace(
      "'ZAR','',null,'direct'",
      "'ZAR','WELCOME10','ffffffff-ffff-4fff-8fff-ffffffffffff','newsletter'",
    );
  const discounted = (await runAs("service_role", "", couponCheckout))
    .rows[0] as Record<string, unknown>;
  assert.equal(discounted.subtotal, 100000);
  assert.equal(discounted.discount, 10000);
  assert.equal(discounted.total, 90000);
  await assert.rejects(
    runAs(
      "service_role",
      "",
      couponCheckout
        .replace(
          "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee",
          "99999999-9999-4999-8999-999999999999",
        )
        .replace("WELCOME10", "EXPIRED"),
    ),
  );
  await assert.rejects(
    runAs(
      "authenticated",
      a,
      `insert into public.events(session_id,kind) values('ffffffff-ffff-4fff-8fff-ffffffffffff','purchase_completed')`,
    ),
  );
  await assert.rejects(
    runAs(
      "authenticated",
      b,
      `insert into public.reviews(user_id,product_id,rating,body) values('${b}','${p}',5,'I did not buy this item')`,
    ),
  );
  await runAs(
    "authenticated",
    a,
    `insert into public.reviews(user_id,product_id,rating,body) values('${a}','${p}',5,'A lovely verified purchase')`,
  );
  await assert.rejects(
    runAs(
      "authenticated",
      a,
      `update public.reviews set user_id='${b}' where user_id='${a}'`,
    ),
  );
  await runAs(
    "authenticated",
    a,
    `insert into public.wishlists(user_id,product_id) values('${a}','${p}')`,
  );
  assert.equal(
    (await runAs("authenticated", b, `select * from public.wishlists`)).rows
      .length,
    0,
  );
  const lines = JSON.stringify([{ product_id: p, quantity: 2 }]);
  await runAs("service_role", "", `select public.save_cart('${a}','${lines}')`);
  const payment = `select public.complete_payment('${discounted.reference}',90000,'ZAR','789')`;
  await runAs("service_role", "", payment);
  await runAs("service_role", "", payment);
  assert.equal(
    (
      await db.query(
        `select * from public.events where kind='purchase_completed' and order_id='${discounted.id}'`,
      )
    ).rows.length,
    1,
  );
  assert.equal(
    (await db.query(`select * from public.carts where user_id='${a}'`)).rows
      .length,
    0,
    "successful purchase clears matching saved cart",
  );
  assert.ok(
    (await db.query("select * from public.inventory_history")).rows.length > 0,
  );
  await runAs("service_role", "", `select public.save_cart('${b}','${lines}')`);
  await db.exec(
    `update public.carts set updated_at=now()-interval '2 days' where user_id='${b}'`,
  );
  assert.equal(
    (
      await runAs(
        "service_role",
        "",
        `select * from public.claim_recovery_carts()`,
      )
    ).rows.length,
    0,
    "no reminders without opt-in",
  );
  await runAs(
    "authenticated",
    b,
    `update public.profiles set recovery_opt_in=true where id='${b}'`,
  );
  assert.equal(
    (
      await runAs(
        "service_role",
        "",
        `select * from public.claim_recovery_carts()`,
      )
    ).rows.length,
    1,
  );
  assert.equal(
    (
      await runAs(
        "service_role",
        "",
        `select * from public.claim_recovery_carts()`,
      )
    ).rows.length,
    0,
    "parallel worker cannot claim an active lease",
  );
  await db.close();
});
