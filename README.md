# Aventurer's Ledger (Libro del Aventurero)

Gestor de mesa para partidas de **Dungeons & Dragons 5e** (soporta reglas **PHB 2014** y
**PHB 2024**). No es una simple calculadora: cubre hojas de personaje, inventario con slots
corporales, economía (cartera, movimientos y transferencias), campañas con roles GM/Jugador,
construcción de mundo (ubicaciones, tiendas, mazmorras y NPCs) y comercio con carrito,
checkout y descuentos raciales.

> **¿Retomando el proyecto o preparando el lanzamiento?**
> Empieza por **[ESTADO_DEL_PROYECTO.md](./ESTADO_DEL_PROYECTO.md)** — estado actual del repo,
> salud del código y checklist de despliegue.

## Stack

- **Next.js 16** (App Router) + **React 19** + TypeScript
- **Tailwind CSS v4** + shadcn/ui (Radix) + lucide-react
- **Supabase** — Auth, Postgres, RLS y funciones RPC
- Desplegado en **Vercel**

## Documentación

| Documento | Contenido |
|-----------|-----------|
| [ESTADO_DEL_PROYECTO.md](./ESTADO_DEL_PROYECTO.md) | Estado actual, retomada y lanzamiento. |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | Arquitectura por capas, convenciones y flujo de Git. |
| [FUTURE_FEATURES.md](./FUTURE_FEATURES.md) | Backlog de producto (implementado / parcial / pendiente). |
| [SECURITY_IMPROVEMENTS.md](./SECURITY_IMPROVEMENTS.md) | Permisos, protección de rutas y sesión. |
| [README_SHOP_ITEMS.md](./README_SHOP_ITEMS.md) | Sistema de ítems de tienda. |

## Variables de entorno

Crea un archivo `.env.local` en la raíz:

```env
# Supabase (obligatorias)
NEXT_PUBLIC_SUPABASE_URL=your-project-url.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# IA (opcionales — sin uso activo por ahora)
GEMINI_API_KEY=
OPENAI_API_KEY=
```

Obtén los valores de Supabase en los [ajustes del proyecto](https://app.supabase.com).
En producción, cárgalas en Vercel bajo **Settings → Environment Variables**.

## Desarrollo local

Requiere **pnpm** (hay `pnpm-lock.yaml`).

```bash
pnpm install
# crea tu .env.local (ver arriba)
pnpm dev
```

Abre [http://localhost:3000](http://localhost:3000).

### Base de datos

Las migraciones SQL están en `scripts/` y se aplican en orden numérico sobre el proyecto
Supabase (editor SQL o CLI). Consulta las notas de aplicación (incluida la numeración
duplicada a revisar) en [ESTADO_DEL_PROYECTO.md](./ESTADO_DEL_PROYECTO.md).

## Scripts

| Comando | Acción |
|---------|--------|
| `pnpm dev` | Servidor de desarrollo |
| `pnpm build` | Build de producción |
| `pnpm start` | Servir el build |
| `pnpm lint` | ESLint con `--fix` |
| `pnpm type-check` | Comprobación de tipos (`tsc --noEmit`) |
| `pnpm format` | Prettier |
