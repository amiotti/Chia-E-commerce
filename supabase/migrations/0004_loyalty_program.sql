alter table public.products
  add column if not exists points_enabled boolean not null default false;

alter table public.products
  add column if not exists points_cost integer null;

alter table public.products
  drop constraint if exists products_points_cost_check;

alter table public.products
  add constraint products_points_cost_check
  check (points_cost is null or points_cost > 0);

create table if not exists public.loyalty_wallets (
  user_id text primary key,
  balance_points integer not null default 0 check (balance_points >= 0),
  lifetime_earned integer not null default 0 check (lifetime_earned >= 0),
  lifetime_redeemed integer not null default 0 check (lifetime_redeemed >= 0),
  updated_at timestamptz not null default now()
);

create table if not exists public.loyalty_redemptions (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  product_id text not null references public.products(id) on delete restrict,
  product_snapshot jsonb not null,
  points_cost integer not null check (points_cost > 0),
  status text not null default 'SOLICITADO' check (status in ('SOLICITADO', 'ENTREGADO', 'CANCELADO')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.loyalty_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  kind text not null check (kind in ('earn', 'redeem', 'adjustment', 'bonus')),
  points integer not null check (points > 0),
  reason text not null,
  order_id text null references public.orders(id) on delete set null,
  redemption_id uuid null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_products_points_enabled on public.products(points_enabled, active);
create index if not exists idx_loyalty_transactions_user_id_created_at on public.loyalty_transactions(user_id, created_at desc);
create index if not exists idx_loyalty_redemptions_user_id_created_at on public.loyalty_redemptions(user_id, created_at desc);
create unique index if not exists idx_loyalty_transactions_earn_order_id on public.loyalty_transactions(order_id)
  where kind = 'earn' and order_id is not null;

create or replace function public.ensure_loyalty_wallet(p_user_id text)
returns void
language plpgsql
as $$
begin
  insert into public.loyalty_wallets (user_id)
  values (p_user_id)
  on conflict (user_id) do nothing;
end;
$$;

create or replace function public.award_loyalty_points_for_order(p_order_id text)
returns integer
language plpgsql
as $$
declare
  v_order record;
  v_items_total numeric := 0;
  v_points integer := 0;
begin
  select id, user_id, shipping, items_snapshot
  into v_order
  from public.orders
  where id = p_order_id;

  if not found or v_order.user_id is null then
    return 0;
  end if;

  perform public.ensure_loyalty_wallet(v_order.user_id);

  if exists (
    select 1
    from public.loyalty_transactions
    where kind = 'earn' and order_id = p_order_id
  ) then
    return 0;
  end if;

  begin
    v_items_total := nullif(coalesce(v_order.shipping ->> 'itemsTotalCents', ''), '')::numeric;
  exception
    when others then
      v_items_total := 0;
  end;

  if coalesce(v_items_total, 0) <= 0 then
    select coalesce(sum(coalesce((item ->> 'subtotalCents')::numeric, 0)), 0)
    into v_items_total
    from jsonb_array_elements(v_order.items_snapshot) as item;
  end if;

  v_points := floor(coalesce(v_items_total, 0) / 100.0);

  if v_points <= 0 then
    return 0;
  end if;

  insert into public.loyalty_transactions (user_id, kind, points, reason, order_id, metadata)
  values (
    v_order.user_id,
    'earn',
    v_points,
    'Puntos acreditados por compra pagada',
    p_order_id,
    jsonb_build_object('orderId', p_order_id)
  );

  update public.loyalty_wallets
  set balance_points = balance_points + v_points,
      lifetime_earned = lifetime_earned + v_points,
      updated_at = now()
  where user_id = v_order.user_id;

  return v_points;
exception
  when unique_violation then
    return 0;
end;
$$;

create or replace function public.redeem_loyalty_product(p_user_id text, p_product_id text)
returns jsonb
language plpgsql
as $$
declare
  v_wallet public.loyalty_wallets%rowtype;
  v_product public.products%rowtype;
  v_redemption public.loyalty_redemptions%rowtype;
  v_balance_after integer;
begin
  perform public.ensure_loyalty_wallet(p_user_id);

  select *
  into v_wallet
  from public.loyalty_wallets
  where user_id = p_user_id
  for update;

  select *
  into v_product
  from public.products
  where id = p_product_id
    and active = true
    and points_enabled = true
  for update;

  if not found then
    raise exception 'PRODUCT_NOT_REDEEMABLE';
  end if;

  if v_product.points_cost is null or v_product.points_cost <= 0 then
    raise exception 'PRODUCT_POINTS_COST_INVALID';
  end if;

  if v_product.stock < 1 then
    raise exception 'PRODUCT_OUT_OF_STOCK';
  end if;

  if v_wallet.balance_points < v_product.points_cost then
    raise exception 'INSUFFICIENT_POINTS';
  end if;

  insert into public.loyalty_redemptions (user_id, product_id, product_snapshot, points_cost, status)
  values (
    p_user_id,
    v_product.id,
    jsonb_build_object(
      'id', v_product.id,
      'slug', v_product.slug,
      'nombre', v_product.name,
      'categoria', v_product.category,
      'imagen', coalesce(v_product.images[1], ''),
      'currency', v_product.currency
    ),
    v_product.points_cost,
    'SOLICITADO'
  )
  returning * into v_redemption;

  insert into public.loyalty_transactions (user_id, kind, points, reason, redemption_id, metadata)
  values (
    p_user_id,
    'redeem',
    v_product.points_cost,
    'Canje de producto por puntos',
    v_redemption.id,
    jsonb_build_object('productId', v_product.id, 'productName', v_product.name)
  );

  v_balance_after := v_wallet.balance_points - v_product.points_cost;

  update public.loyalty_wallets
  set balance_points = v_balance_after,
      lifetime_redeemed = lifetime_redeemed + v_product.points_cost,
      updated_at = now()
  where user_id = p_user_id;

  update public.products
  set stock = stock - 1,
      updated_at = now()
  where id = v_product.id;

  return jsonb_build_object(
    'redemptionId', v_redemption.id,
    'productId', v_product.id,
    'productName', v_product.name,
    'pointsCost', v_product.points_cost,
    'balancePoints', v_balance_after,
    'status', v_redemption.status
  );
end;
$$;