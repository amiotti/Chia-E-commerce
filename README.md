# CHIA E-commerce

MVP e-commerce de **CHÃA Espacio Saludable** construido por etapas con Next.js + InstantDB + pagos (Mercado Pago / Galio Pay).

## Estado actual
- `Paso 0`: bootstrap monorepo + Next.js + Tailwind + ESLint âœ…
- `Paso 1`: schemas/shared + cliente InstantDB + diagnÃ³stico inicial âœ…
- `Paso 2`: catÃ¡logo pÃºblico + detalle + admin de productos (manual/importaciÃ³n) âœ…
- `Paso 3`: auth local + RBAC (`user/admin`) âœ…
- `Paso 4`: carrito + checkout + Ã³rdenes `PENDIENTE_PAGO` âœ…
- `Paso 5`: pagos (Mercado Pago Checkout API + Galio Pay) + webhooks base/reconciliaciÃ³n âœ…
- `Paso 6`: hardening (headers, rate limit simple, origin checks, webhook secret) âœ…
- `Paso 7`: QA y documentaciÃ³n final âœ… (este README + diagnÃ³stico final)

## Stack
- `Next.js` (App Router)
- `TypeScript`
- `Tailwind CSS`
- `InstantDB` (DB / persistencia)
- `Zod`
- `Mercado Pago Checkout API`
- `Galio Pay`

## Estructura
- `apps/web`: app principal Next.js
- `packages/shared`: schemas y tipos compartidos (`zod`)
- `supabase/migrations`: SQL para tablas base

## Requisitos
- `Node.js` 20+
- `npm`
- Proyecto InstantDB activo

## Variables de entorno
Para `Next.js` en este monorepo, usar:
- `apps/web/.env.local` (obligatorio para runtime)

TambiÃ©n podÃ©s mantener copia en raÃ­z (`.env.local`), pero la app lee desde `apps/web/.env.local`.

Variables principales:
- `NEXT_PUBLIC_INSTANT_APP_ID`
- `INSTANT_APP_ADMIN_TOKEN`
- `INSTANT_API_URI (opcional)`
- `SESSION_SECRET`
- `NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY`
- `MERCADOPAGO_ACCESS_TOKEN`
- `MERCADOPAGO_WEBHOOK_SECRET` (recomendado para deploy)
- `GALIOPAY_CLIENT_ID`
- `GALIOPAY_API_BASE_URL`
- `GALIOPAY_API_KEY`
- `GALIOPAY_WEBHOOK_SECRET` (recomendado para deploy)

## InstalaciÃ³n y desarrollo
```bash
npm install
npm run dev
```

Abrir:
- `http://localhost:3000`

## Modelo de datos InstantDB
La app usa estas entidades:
- `users_profile`
- `products`
- `carts`
- `orders`
- `payments`
- `loyalty_wallets`
- `loyalty_transactions`
- `loyalty_redemptions`

## Datos de prueba (catÃ¡logo)
Si la tabla `products` estÃ¡ vacÃ­a, podÃ©s:
- cargar desde `/admin/productos` (manual o importaciÃ³n `.json/.csv`)
- o insertar seed de prueba (ya se usÃ³ durante el desarrollo)

## Flujo de prueba recomendado (QA manual)
### 1) Auth / cuenta
1. Ir a `/cuenta/registro`
2. Registrar primer usuario (queda `admin`)
3. Ir a `/cuenta`
4. Verificar rol y acceso a `Panel admin (Perfil)`

### 2) Admin productos
1. Ir a `/admin/productos`
2. Crear producto manualmente
3. Probar importaciÃ³n `.json` / `.csv`
4. Verificar filas en `products` (InstantDB)

### 3) CatÃ¡logo
1. Abrir `/catalogo`
2. Abrir un producto `/catalogo/[slug]`
3. Agregar al carrito

### 4) Checkout / Ã³rdenes
1. Ir a `/carrito`
2. Ir a `/checkout`
3. Crear orden
4. Verificar `orders` (`PENDIENTE_PAGO`)

### 5) Pagos
#### Mercado Pago
1. Abrir `/ordenes/[id]`
2. Click `Pagar con Mercado Pago`
3. Completar flujo sandbox
4. Verificar `payments` y webhook / estado de orden

#### Galio Pay
1. Abrir `/ordenes/[id]`
2. Click `Transferencia (Galio Pay)`
3. Verificar redirecciÃ³n a link de pago Galio (si responde `url`)
4. Verificar `payments`

### 6) Webhooks
- Mercado Pago: `POST /api/webhooks/mercadopago`
- Galio Pay: `POST /api/webhooks/galiopay`

Los webhooks actualizan `payments` y `orders.status` (mapeo best-effort de estados).

## DiagnÃ³sticos Ãºtiles
- `GET /api/diagnostico/paso-1` -> setup inicial (schemas/env/seed)
- `GET /api/diagnostico/paso-7` -> validaciÃ³n final (env, tablas, pagos, webhooks)

El diagnÃ³stico `Paso 7` muestra:
- configuraciÃ³n InstantDB (public/admin)
- conteo de entidades (`users_profile`, `products`, `carts`, `orders`, `payments`)
- configuraciÃ³n de pagos (MP/Galio)
- recomendaciones antes de deploy

## Seguridad / hardening implementado (Paso 6)
- `security headers` globales (Next)
- `rate limiting` simple en memoria para rutas sensibles
- `Origin check` en mutaciones admin
- `webhook shared secret` (si configurÃ¡s `MERCADOPAGO_WEBHOOK_SECRET` / `GALIOPAY_WEBHOOK_SECRET`)

## Importante (producciÃ³n)
### Webhooks con secreto
Configurar URL con secreto compartido (si usÃ¡s este modo):
- Mercado Pago: `https://tu-dominio/api/webhooks/mercadopago?secret=TU_SECRETO`
- Galio Pay: `https://tu-dominio/api/webhooks/galiopay?secret=TU_SECRETO`

Y setear el mismo valor en:
- `MERCADOPAGO_WEBHOOK_SECRET`
- `GALIOPAY_WEBHOOK_SECRET`

### Pendientes recomendados antes de producciÃ³n real
- ValidaciÃ³n criptogrÃ¡fica nativa de firmas de webhooks (no solo secret compartido)
- Rate limit persistente (Redis) en lugar de memoria
- Migrar auth local a Instant Auth (opcional)
- Observabilidad (logs centralizados / errores)
- Pruebas automatizadas E2E

## Comandos Ãºtiles
```bash
npm run build
npm run lint
npm run test
```

## Branding / UI
- Paleta CHÃA aplicada (verde, crema, rosa)
- `The Seasons` + `Along Sans s2` cargadas localmente (`next/font/local`)
- modo oscuro con toggle (sol/luna)
- favicon con logo simplificado CHÃA

## Troubleshooting rÃ¡pido
### Error: `InstantDB no estÃ¡ configurado`
- verificar `NEXT_PUBLIC_INSTANT_APP_ID` e `INSTANT_APP_ADMIN_TOKEN` en `apps/web/.env.local`
- reiniciar `npm run dev`

### CatÃ¡logo vacÃ­o
- revisar `products` en InstantDB
- probar `/api/diagnostico/paso-7`
- cargar productos desde `/admin/productos`

### Problemas de webhooks
- confirmar URL pÃºblica (deploy o tÃºnel)
- revisar secretos (`MERCADOPAGO_WEBHOOK_SECRET`, `GALIOPAY_WEBHOOK_SECRET`)
- revisar `payments` / `orders`

