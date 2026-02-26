# CHIA E-commerce

MVP e-commerce de **CHÍA Espacio Saludable** construido por etapas con Next.js + Supabase + pagos (Mercado Pago / Galio Pay).

## Estado actual
- `Paso 0`: bootstrap monorepo + Next.js + Tailwind + ESLint ✅
- `Paso 1`: schemas/shared + clientes Supabase + diagnóstico inicial ✅
- `Paso 2`: catálogo público + detalle + admin de productos (manual/importación) ✅
- `Paso 3`: auth local + RBAC (`user/admin`) ✅
- `Paso 4`: carrito + checkout + órdenes `PENDIENTE_PAGO` ✅
- `Paso 5`: pagos (Mercado Pago Checkout API + Galio Pay) + webhooks base/reconciliación ✅
- `Paso 6`: hardening (headers, rate limit simple, origin checks, webhook secret) ✅
- `Paso 7`: QA y documentación final ✅ (este README + diagnóstico final)

## Stack
- `Next.js` (App Router)
- `TypeScript`
- `Tailwind CSS`
- `Supabase` (DB / persistencia)
- `Zod`
- `Mercado Pago Checkout API`
- `Galio Pay`

## Estructura
- `apps/web`: app principal Next.js
- `packages/shared`: schemas y tipos compartidos (`zod`)
- `supabase/migrations`: SQL para tablas base

## Requisitos
- `Node.js` 20+
- `pnpm`
- Proyecto Supabase activo

## Variables de entorno
Para `Next.js` en este monorepo, usar:
- `apps/web/.env.local` (obligatorio para runtime)

También podés mantener copia en raíz (`.env.local`), pero la app lee desde `apps/web/.env.local`.

Variables principales:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SESSION_SECRET`
- `NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY`
- `MERCADOPAGO_ACCESS_TOKEN`
- `MERCADOPAGO_WEBHOOK_SECRET` (recomendado para deploy)
- `GALIOPAY_CLIENT_ID`
- `GALIOPAY_API_BASE_URL`
- `GALIOPAY_API_KEY`
- `GALIOPAY_WEBHOOK_SECRET` (recomendado para deploy)

## Instalación y desarrollo
```bash
pnpm install
pnpm dev
```

Abrir:
- `http://localhost:3000`

## Migraciones Supabase (obligatorio)
Ejecutar en `SQL Editor` de Supabase, en este orden:
1. `supabase/migrations/0001_mvp_init.sql`
2. `supabase/migrations/0002_users_profile_password_hash.sql`

Esto crea:
- `users_profile`
- `products`
- `carts`
- `orders`
- `payments`
- y agrega `password_hash` a `users_profile`

## Datos de prueba (catálogo)
Si la tabla `products` está vacía, podés:
- cargar desde `/admin/productos` (manual o importación `.json/.csv`)
- o insertar seed de prueba (ya se usó durante el desarrollo)

## Flujo de prueba recomendado (QA manual)
### 1) Auth / cuenta
1. Ir a `/cuenta/registro`
2. Registrar primer usuario (queda `admin`)
3. Ir a `/cuenta`
4. Verificar rol y acceso a `Panel admin (Perfil)`

### 2) Admin productos
1. Ir a `/admin/productos`
2. Crear producto manualmente
3. Probar importación `.json` / `.csv`
4. Verificar filas en `public.products` (Supabase)

### 3) Catálogo
1. Abrir `/catalogo`
2. Abrir un producto `/catalogo/[slug]`
3. Agregar al carrito

### 4) Checkout / órdenes
1. Ir a `/carrito`
2. Ir a `/checkout`
3. Crear orden
4. Verificar `public.orders` (`PENDIENTE_PAGO`)

### 5) Pagos
#### Mercado Pago
1. Abrir `/ordenes/[id]`
2. Click `Pagar con Mercado Pago`
3. Completar flujo sandbox
4. Verificar `payments` y webhook / estado de orden

#### Galio Pay
1. Abrir `/ordenes/[id]`
2. Click `Transferencia (Galio Pay)`
3. Verificar redirección a link de pago Galio (si responde `url`)
4. Verificar `payments`

### 6) Webhooks
- Mercado Pago: `POST /api/webhooks/mercadopago`
- Galio Pay: `POST /api/webhooks/galiopay`

Los webhooks actualizan `payments` y `orders.status` (mapeo best-effort de estados).

## Diagnósticos útiles
- `GET /api/diagnostico/paso-1` -> setup inicial (schemas/env/seed)
- `GET /api/diagnostico/paso-7` -> validación final (env, tablas, pagos, webhooks)

El diagnóstico `Paso 7` muestra:
- configuración Supabase (public/server)
- conteo de tablas (`users_profile`, `products`, `carts`, `orders`, `payments`)
- configuración de pagos (MP/Galio)
- recomendaciones antes de deploy

## Seguridad / hardening implementado (Paso 6)
- `security headers` globales (Next)
- `rate limiting` simple en memoria para rutas sensibles
- `Origin check` en mutaciones admin
- `webhook shared secret` (si configurás `MERCADOPAGO_WEBHOOK_SECRET` / `GALIOPAY_WEBHOOK_SECRET`)

## Importante (producción)
### Webhooks con secreto
Configurar URL con secreto compartido (si usás este modo):
- Mercado Pago: `https://tu-dominio/api/webhooks/mercadopago?secret=TU_SECRETO`
- Galio Pay: `https://tu-dominio/api/webhooks/galiopay?secret=TU_SECRETO`

Y setear el mismo valor en:
- `MERCADOPAGO_WEBHOOK_SECRET`
- `GALIOPAY_WEBHOOK_SECRET`

### Pendientes recomendados antes de producción real
- Validación criptográfica nativa de firmas de webhooks (no solo secret compartido)
- Rate limit persistente (Redis) en lugar de memoria
- Migrar auth local a Supabase Auth
- Observabilidad (logs centralizados / errores)
- Pruebas automatizadas E2E

## Comandos útiles
```bash
pnpm build
pnpm lint
pnpm test
```

## Branding / UI
- Paleta CHÍA aplicada (verde, crema, rosa)
- `The Seasons` + `Along Sans s2` cargadas localmente (`next/font/local`)
- modo oscuro con toggle (sol/luna)
- favicon con logo simplificado CHÍA

## Troubleshooting rápido
### Error: `Supabase service role no está configurado`
- verificar `SUPABASE_SERVICE_ROLE_KEY` en `apps/web/.env.local`
- reiniciar `pnpm dev`

### Catálogo vacío
- revisar `public.products` en Supabase
- probar `/api/diagnostico/paso-7`
- cargar productos desde `/admin/productos`

### Problemas de webhooks
- confirmar URL pública (deploy o túnel)
- revisar secretos (`MERCADOPAGO_WEBHOOK_SECRET`, `GALIOPAY_WEBHOOK_SECRET`)
- revisar `public.payments` / `public.orders`