begin;

update public.products
set price_cents = round(price_cents / 100.0)
where price_cents >= 100;

commit;
