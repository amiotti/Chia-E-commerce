alter table public.users_profile enable row level security;
alter table public.carts enable row level security;
alter table public.orders enable row level security;
alter table public.payments enable row level security;
alter table public.loyalty_wallets enable row level security;
alter table public.products enable row level security;
alter table public.loyalty_redemptions enable row level security;
alter table public.loyalty_transactions enable row level security;

drop policy if exists "public can read active products" on public.products;
create policy "public can read active products"
on public.products
for select
to anon, authenticated
using (active = true);

drop policy if exists "users can read own profile" on public.users_profile;
create policy "users can read own profile"
on public.users_profile
for select
to authenticated
using (id::text = auth.uid()::text);

drop policy if exists "users can update own profile" on public.users_profile;
create policy "users can update own profile"
on public.users_profile
for update
to authenticated
using (id::text = auth.uid()::text)
with check (id::text = auth.uid()::text);

drop policy if exists "users can read own cart" on public.carts;
create policy "users can read own cart"
on public.carts
for select
to authenticated
using (user_id = auth.uid()::text);

drop policy if exists "users can insert own cart" on public.carts;
create policy "users can insert own cart"
on public.carts
for insert
to authenticated
with check (user_id = auth.uid()::text);

drop policy if exists "users can update own cart" on public.carts;
create policy "users can update own cart"
on public.carts
for update
to authenticated
using (user_id = auth.uid()::text)
with check (user_id = auth.uid()::text);

drop policy if exists "users can read own orders" on public.orders;
create policy "users can read own orders"
on public.orders
for select
to authenticated
using (user_id = auth.uid()::text);

drop policy if exists "users can insert own orders" on public.orders;
create policy "users can insert own orders"
on public.orders
for insert
to authenticated
with check (user_id = auth.uid()::text);

drop policy if exists "users can read own payments" on public.payments;
create policy "users can read own payments"
on public.payments
for select
to authenticated
using (
  exists (
    select 1
    from public.orders
    where orders.id = payments.order_id
      and orders.user_id = auth.uid()::text
  )
);

drop policy if exists "users can read own loyalty wallet" on public.loyalty_wallets;
create policy "users can read own loyalty wallet"
on public.loyalty_wallets
for select
to authenticated
using (user_id = auth.uid()::text);

drop policy if exists "users can read own loyalty redemptions" on public.loyalty_redemptions;
create policy "users can read own loyalty redemptions"
on public.loyalty_redemptions
for select
to authenticated
using (user_id = auth.uid()::text);

drop policy if exists "users can read own loyalty transactions" on public.loyalty_transactions;
create policy "users can read own loyalty transactions"
on public.loyalty_transactions
for select
to authenticated
using (user_id = auth.uid()::text);

alter function public.ensure_loyalty_wallet(text) set search_path = public;
alter function public.award_loyalty_points_for_order(text) set search_path = public;
alter function public.redeem_loyalty_product(text, text) set search_path = public;