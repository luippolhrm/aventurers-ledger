# 01 — Visión general

## Qué es

**Aventurer's Ledger** ("Libro del Aventurero") es una aplicación web para gestionar
partidas de **Dungeons & Dragons 5e**. Su foco es la **logística de mesa**: personajes
con su economía e inventario, campañas con roles diferenciados (Game Master y
jugadores), construcción de mundo (ubicaciones, tiendas, mazmorras, NPCs) y un
sistema de comercio completo con carrito y compra atómica.

**Qué NO es** (verificado en código): no es una hoja de personaje completa ni un
simulador de combate. No existen puntos de golpe, clase de armadura, iniciativa,
velocidad (esas columnas se eliminaron de la base de datos en la migración
`scripts/036_simplify_characters_table.sql` y no volvieron), tiradas de dados,
hechizos del personaje ni tracker de combate.

## Soporte de reglas

- Soporta la creación de personajes bajo **PHB 2024** (por defecto) y **PHB 2014**
  (razas y subrazas con bonos raciales). La distinción se guarda en
  `characters.rules_system` (`5e_2024` | `5e_2014`).
- ⚠️ Existe una anomalía: al crear un personaje, el código fuerza
  `rules_system: "5e_2024"` aunque se haya usado el flujo 2014
  (`lib/application/services/character-service.ts`). Ver
  [99 — Pendientes y hallazgos](./99-pendientes-y-hallazgos.md).

## Stack tecnológico

| Capa | Tecnología | Notas |
|---|---|---|
| Framework | Next.js 16 (App Router) + React 19 + TypeScript | Type-check obligatorio en build (`ignoreBuildErrors: false` en `next.config.mjs`) |
| UI | Tailwind CSS v4 + shadcn/ui (Radix) + lucide-react | Tema claro/oscuro según el sistema operativo (sin toggle manual) |
| Backend | Supabase | Auth (email + OAuth Google), Postgres con RLS, funciones RPC, triggers |
| Sesión SSR | `@supabase/ssr` | Middleware `proxy.ts` (nombre oficial de middleware en Next 16) refresca la sesión |
| Deploy | Vercel | Rama de producción: `main` |
| Gestor de paquetes | pnpm | Hay `pnpm-lock.yaml` |

**Librerías instaladas pero sin ningún uso en el código** (candidatas a retirar o a
features futuras): `openai`, `@google/generative-ai`, `recharts`,
`embla-carousel-react`. Ver hallazgos.

## Cómo se ejecuta

```bash
pnpm install
# Crear .env.local con:
#   NEXT_PUBLIC_SUPABASE_URL=...
#   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
pnpm dev          # http://localhost:3000
```

Otros comandos: `pnpm build` (producción), `pnpm type-check`, `pnpm lint`,
`pnpm format`.

### Base de datos

Las migraciones viven en `scripts/` y se aplican **manualmente en orden alfabético
de nombre de archivo** (editor SQL de Supabase o CLI). No hay runner automático.
El orden canónico, el historial de renombrados y la política de numeración están
en `scripts/README.md`. Los scripts de `scripts/diagnostics/` son de solo lectura
y no se aplican en producción.

### Despliegue

1. Aplicar las migraciones de `scripts/` en un proyecto Supabase.
2. Configurar las dos variables de entorno en Vercel.
3. Deploy desde la rama `main` (flujo Git: `feature/fix → develop → main`).

Checklist completo de lanzamiento en `ESTADO_DEL_PROYECTO.md` (raíz del repo).

## Estructura de carpetas

```
├── app/                        # Rutas (Next.js App Router)
│   ├── auth/                   # Login, registro, callback OAuth (público)
│   ├── (app)/                  # Grupo protegido por sesión (ProtectedRoute)
│   │   ├── dashboard/          # Inicio
│   │   ├── characters/         # Personajes y subrutas (hoja, editar, unirse a campaña…)
│   │   ├── campaigns/          # Campañas y todo el mundo (ubicaciones, tiendas, NPCs, mazmorras)
│   │   ├── shop-items/         # Catálogo/gestión de items de una tienda
│   │   ├── profile/ settings/  # Perfil y ajustes
│   │   └── test-services/      # ⚠️ Herramienta interna de QA (no enlazada)
│   ├── layout.tsx              # Providers globales (tema, idioma, auth)
│   └── page.tsx                # "/" → redirige a /dashboard
├── components/
│   ├── features/               # Vistas por dominio (generación NUEVA de UI)
│   ├── organisms/ molecules/ atoms/  # Atomic design
│   ├── ui/                     # shadcn/ui base
│   ├── auth/                   # ProtectedRoute
│   └── *.tsx                   # Componentes LEGACY (algunos vivos, otros muertos — ver hallazgos)
├── lib/
│   ├── application/
│   │   ├── services/           # 16 servicios = casos de uso (lógica de negocio)
│   │   └── utils/              # ValidationUtils, PermissionUtils, utils de hoja de personaje
│   ├── infrastructure/
│   │   ├── repositories/       # 16 repositorios Supabase (acceso a datos)
│   │   └── errors/             # ErrorCode, AppError, ErrorService
│   ├── services/               # Capa VIEJA: catálogos de dominio aún vivos
│   │   ├── character-sheet-config.ts   # Fórmulas de la hoja (capacidad de carga, modificadores)
│   │   ├── racial-traits-service.ts    # Especies/razas/linajes 2024 y 2014
│   │   ├── item-form-config.ts         # Categorías de item y slots equipables
│   │   └── shopping-cart-service.ts    # ⚠️ MUERTO (duplicado del nuevo)
│   ├── supabase/               # Clientes browser/server + refresh de sesión
│   ├── language-context.tsx    # Contexto de idioma (español)
│   ├── texts.ts                # Textos de la UI (fuente i18n real)
│   ├── translations.ts         # ⚠️ Legacy: solo lo usa el conversor de monedas
│   └── auth-context.tsx        # Contexto de sesión y perfil
├── hooks/                      # use-services, use-shopping-cart, use-toast, use-character-notes, use-page-title
├── scripts/                    # Migraciones SQL (+ diagnostics/ de solo lectura)
├── proxy.ts                    # Middleware (refresh de sesión + guardas de ruta)
└── docs/                       # Esta documentación
```

## Documentación complementaria en el repo

| Archivo | Contenido |
|---|---|
| `ESTADO_DEL_PROYECTO.md` | Informe de estado, checklist de lanzamiento |
| `ARCHITECTURE.md` | Convenciones de arquitectura y flujo Git |
| `FUTURE_FEATURES.md` | Backlog de producto |
| `SECURITY_IMPROVEMENTS.md` | Historia del sistema de permisos |
| `scripts/README.md` | Orden canónico de migraciones |
