# Chia E-commerce

Base del proyecto e-commerce (MVP) construida en etapas.

## Etapa actual
- Paso 0/1: monorepo, Next.js (App Router), Tailwind, ESLint/Prettier, branding CHÍA (paleta + assets) y base de schemas/Supabase.

## Estructura
- `apps/web`: frontend Next.js (SPA principal)
- `packages/shared`: tipos/utilidades compartidas (zod en siguiente etapa)

## Comandos esperados
> Requiere `pnpm` instalado globalmente.

```bash
pnpm install
pnpm dev
pnpm build
pnpm lint
```

## Probar localmente (Paso 0)
1. Instalar `pnpm` si no está disponible.
2. Ejecutar `pnpm install` en la raíz.
3. Ejecutar `pnpm dev`.
4. Abrir `http://localhost:3000`.

## Próxima etapa (Paso 1)
- `packages/shared` con schemas zod
- Conexión Supabase
- Seed básico de productos
