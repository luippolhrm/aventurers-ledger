# Estado del Proyecto — Libro del Aventurero (D&D)

> **Documento de retomada y lanzamiento.** Punto único de entrada para entender en qué
> quedó el proyecto, cómo continuarlo y qué falta para ponerlo en producción.
>
> **Fecha de este informe:** 2026-07-10
> **Rama analizada:** `develop` (idéntica a `main`, sincronizada con `origin/develop`)

---

## 1. Resumen ejecutivo

**Qué es:** Aplicación web de gestión para partidas de **Dungeons & Dragons 5e** (soporta
reglas **PHB 2014** y **PHB 2024**). Es un "gestor de mesa" completo, no solo una calculadora:
hojas de personaje, inventario con slots corporales, economía (cartera, movimientos,
transferencias entre personajes), campañas con roles GM/Jugador, construcción de mundo
(ubicaciones, tiendas, mazmorras, NPCs) y comercio con carrito, checkout y descuentos raciales.

**En qué punto está:** **Producto funcional y desplegable.** El grueso de los módulos está
implementado y el build de producción compila correctamente. El proyecto está en una fase de
**pulido y consolidación**, no de construcción inicial. Hay:
- Un **trabajo en curso sin commitear** (descuentos de tienda) casi terminado.
- **Deuda técnica conocida**: 119 errores de TypeScript enmascarados por configuración de build.
- Un backlog claro de features futuras ya documentado.

**Veredicto:** se puede lanzar un MVP con lo que hay hoy. Antes conviene cerrar el WIP,
aplicar las migraciones SQL pendientes y decidir qué hacer con la deuda de tipos.

---

## 2. Estado del repositorio (lo primero a resolver)

### Ramas
- `develop` y `main` apuntan **al mismo commit** (sin divergencia) y `develop` está
  **sincronizada con `origin/develop`**. No hay commits locales sin subir.
- Último commit: `d9d0e56 docs: flujo de Git, ramas y entornos en ARCHITECTURE`.
- Ramas viejas que se pueden limpiar: `refactor/move-services-to-application`,
  `remotes/origin/react-jsx-ed61d`.

### ⚠️ Trabajo sin commitear (Work In Progress)
Hay cambios en el árbol de trabajo que **no están guardados en Git**. Todos giran en torno a
**una misma feature: alinear el descuento racial de tienda entre la app y la base de datos.**

| Archivo | Rol en el WIP |
|---------|---------------|
| `scripts/076_process_purchase_shop_discount.sql` *(nuevo)* | Reescribe la función RPC `process_purchase` de Postgres para aplicar el descuento (`characters.shop_bonuses.discount_percent`) **igual que la capa TS**. Antes divergían: el frontend aplicaba descuento pero la BD cobraba precio completo. |
| `lib/application/services/shopping-cart-service.ts` | Lógica de cálculo del carrito con descuento (+129/-… líneas). |
| `hooks/use-shopping-cart.ts` | Hook de carrito reescrito (~166 líneas cambiadas). |
| `components/cart-item.tsx`, `components/shopping-cart.tsx`, `components/finances.tsx` | UI de carrito/precios. |
| `lib/application/services/location-service.ts`, `transfer-service.ts`, `utils/validation.ts` | Ajustes de soporte. |
| `components/features/world/location-view.tsx`, `world-settings-view.tsx`, `locations.tsx`, `organisms/world/*` | Retoques de vistas de mundo. |
| `FUTURE_FEATURES.md` | Actualización del backlog. |

**Acción recomendada:** revisar el diff, y **commitear como una unidad** (ej.
`feat: alinear descuento racial de tienda entre capa TS y RPC process_purchase`).
Está prácticamente terminado y es coherente; no conviene dejarlo colgando.

### Archivos sin trackear
- `.claude/`, `.cursor/` — configuración de herramientas de IA. Añadir a `.gitignore` si no se quieren versionar.
- `.env.local` — **correcto que no esté versionado** (`.gitignore` ignora `.env*`).

---

## 3. Salud del código

| Indicador | Estado | Detalle |
|-----------|--------|---------|
| Build de producción (`npm run build`) | ✅ **Pasa** (exit 0) | Compila y genera la app, con type-check activado. |
| Type-check (`npm run type-check`) | ✅ **0 errores** | Saldados los 119 errores previos (julio 2026). |
| Lint | Configurado (ESLint + Prettier) | No verificado en este informe. |

### Deuda de TypeScript — SALDADA ✅
Los **119 errores** que estaban enmascarados por `ignoreBuildErrors: true` se han
resuelto por completo y ese flag ahora está en **`false`**, de modo que el build falla
si se introduce un error de tipos (ya no se puede volver a acumular deuda en silencio).

Origen (refactors que se habían dejado a medias) y cómo se cerraron:

1. **i18n / traducciones**: se expuso `language` en `LanguageContextType`, se eliminaron
   objetos duplicados en `texts.ts` y se añadieron las claves faltantes.
2. **`EmptyState`**: el componente ahora acepta `children` e `icon` opcional.
3. **Tipos de dominio**: `AbilityScores` unificado a `number | null`, `Character.class`
   (antes `class_name`), `description` opcional, tamaño `"huge"`, `CheckoutResult`
   exportado, `CreateLocation`/`CreateShop` completos, y varios casts de moneda.
4. **Bug latente corregido de paso**: el dashboard filtraba GM/jugador por campos
   (`is_gm`/`is_player`) que nunca se asignaban; ahora deriva el rol de `game_master_id`.

---

## 4. Stack y arquitectura

- **Framework:** Next.js **16** (App Router) + React **19** + TypeScript.
- **UI:** Tailwind CSS **v4** + shadcn/ui (Radix) + lucide-react. Gráficas con Recharts.
- **Backend/BD:** **Supabase** — Auth, Postgres, RLS y funciones RPC (`SECURITY DEFINER`).
- **Middleware:** `proxy.ts` (nombre nuevo de middleware en Next 16) refresca la sesión de Supabase.
- **IA:** `@google/generative-ai` y `openai` instaladas **pero sin uso activo** (ver backlog).
- **Deploy:** Vercel (sincronizado originalmente con v0.app).

**Arquitectura por capas** (detalle completo en [`ARCHITECTURE.md`](./ARCHITECTURE.md)):
```
Presentation (components/, atomic design)
   → Application (lib/application/services  ← los servicios SON los casos de uso)
      → Infrastructure (lib/infrastructure/repositories, Supabase)
         → Base de datos (Postgres/Supabase)
```
- **17 servicios** de aplicación (auth, campaign, character, wallet, inventory, movement,
  transfer, shop, shopping-cart, location, dungeon, npc, feat, profile, currency-converter…).
- **14 repositorios** con sus tipos.
- Permisos centralizados en `PermissionUtils` (defensa en profundidad junto a RLS) —
  ver [`SECURITY_IMPROVEMENTS.md`](./SECURITY_IMPROVEMENTS.md).
- Navegación **por páginas** (App Router), no por tabs — regla estricta del proyecto.
  Hay ~45 rutas bajo `app/(app)/`.

---

## 5. Mapa de funcionalidades

Fuente de verdad detallada: [`FUTURE_FEATURES.md`](./FUTURE_FEATURES.md). Resumen:

| Módulo | Estado |
|--------|--------|
| Autenticación y sesión (Supabase Auth, rutas protegidas, perfil) | ✅ Implementado |
| Hoja de personaje (PHB 2014/2024, razas/linajes, rasgos, trasfondos, origin feats, notas) | ✅ Implementado |
| Inventario (11 slots + 3 contenedores, peso, categorías, equipamiento) | ✅ Implementado |
| Economía (5 divisas, cartera, movimientos, conversión, transferencias) | ✅ Implementado |
| Campañas (roles GM/Jugador, código de invitación, gestión de miembros) | ✅ Implementado |
| Portal GM / Construcción de mundo (ubicaciones, tiendas, mazmorras, salas, NPCs con loot) | ✅ Implementado |
| Comercio (carrito, checkout con validación de fondos, descuento racial) | ✅ Implementado *(descuento en pulido — ver WIP §2)* |
| Dashboard | ✅ Implementado |
| Capacidad de carga (enforcement) | ⚠️ Parcial (display sí, bloqueo no) |
| Transferencias avanzadas (préstamos, trueques) | ⚠️ Parcial |
| Dotes/Feats (más allá de Origin Feats) | ⚠️ Parcial |
| Libro de hechizos | 🔲 Pendiente |
| Calculadora de dados | 🔲 Pendiente |
| Combate / iniciativa | 🔲 Pendiente |
| Notificaciones en tiempo real (Supabase Realtime) | 🔲 Pendiente |
| Asistente de IA (libs instaladas, sin uso) | 🔲 Pendiente |

---

## 6. Cómo retomar el desarrollo (pasos inmediatos)

1. **Instalar dependencias:** `pnpm install` (el proyecto usa `pnpm`, hay `pnpm-lock.yaml`).
2. **Configurar entorno:** crear/verificar `.env.local` con las 4 variables (§7).
3. **Levantar en local:** `pnpm dev` → http://localhost:3000
4. **Cerrar el WIP:** revisar `git diff`, aplicar el script `076_process_purchase_shop_discount.sql`
   en Supabase, probar una compra con descuento y **commitear** el bloque (§2).
5. **Limpiar numeración SQL** (§7): hay números duplicados (`076`, `083`).
6. Eliminar la ruta de desarrollo `app/(app)/test-services/` antes de producción.

> Nota: la deuda de TypeScript (119 errores) ya está saldada y el build valida tipos.

---

## 7. Cómo lanzar a producción (checklist)

### a) Supabase
- [ ] Crear proyecto Supabase (o usar el existente de `.env.local`).
- [ ] **Aplicar las 92 migraciones SQL de `scripts/` en orden numérico.** ⚠️ Cuidado:
  - Hay **números duplicados**: dos `076` (`076_add_location_is_active.sql` y
    `076_process_purchase_shop_discount.sql`) y dos `083`. Definir el orden real de aplicación
    y, mejor aún, **renumerar** para evitar ambigüedad.
  - `debug_wallet_issue.sql` es un script de depuración, **no** una migración: no aplicarlo en prod.
  - No hay runner automático de migraciones; se aplican manualmente (SQL editor de Supabase o CLI).
- [ ] Verificar que las políticas **RLS** y las funciones RPC (`process_purchase`,
  `calculate_wallet_deduction`, `get_campaign_members`, etc.) quedaron creadas.

### b) Variables de entorno (`.env.local` en local / Vercel en prod)
```env
NEXT_PUBLIC_SUPABASE_URL=...        # URL del proyecto Supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=...   # Clave anónima
GEMINI_API_KEY=...                  # Solo si se activa IA (hoy sin uso)
OPENAI_API_KEY=...                  # Solo si se activa IA (hoy sin uso)
```
> Las dos primeras son **obligatorias**. Las de IA son opcionales mientras no haya features de IA.

### c) Despliegue (Vercel)
- [ ] Conectar el repo a Vercel (ya existía integración v0/Vercel — ver `README.md`).
- [ ] Cargar las variables de entorno en Vercel.
- [ ] Definir la rama de producción (`main`) y el flujo `develop → main` (ver ARCHITECTURE §Git).
- [ ] Build command `next build` (ya configurado). Imágenes en modo `unoptimized`.

### d) Antes de abrir al público (recomendado)
- [x] ~~Saldar TS / `ignoreBuildErrors`~~ — hecho: 0 errores y validación activada.
- [ ] Quitar `app/(app)/test-services/`.
- [ ] Revisar RLS de cada tabla con datos de usuario (personajes, wallets, inventario, carritos).
- [ ] Probar el flujo end-to-end: registro → crear personaje → crear campaña → unirse →
      comprar en tienda con descuento → ver movimiento y wallet.

---

## 8. Riesgos y deuda técnica conocida

| Riesgo | Impacto | Mitigación |
|--------|---------|------------|
| ~~119 errores de TS ocultos~~ | — | ✅ Resuelto: 0 errores y `ignoreBuildErrors: false`. |
| Numeración SQL duplicada (`076`, `083`) | Migraciones aplicadas en orden incorrecto | Renumerar y documentar orden canónico. |
| i18n a medias | Textos rotos si se activa otro idioma | Completar o retirar el sistema de traducciones. |
| Descuento de tienda sin commitear | Trabajo se puede perder | Commitear el WIP (§2). |
| Enforcement de capacidad de carga solo informativo | Reglas no se aplican | Ver FUTURE_FEATURES (parcial). |
| Sin tests automatizados visibles | Regresiones difíciles de detectar | Añadir tests unitarios de servicios (arquitectura lo facilita). |

---

## 9. Índice de documentación

| Documento | Contenido |
|-----------|-----------|
| **`ESTADO_DEL_PROYECTO.md`** *(este)* | Estado actual, retomada y lanzamiento. |
| [`ARCHITECTURE.md`](./ARCHITECTURE.md) | Arquitectura por capas, convenciones, flujo de Git. |
| [`FUTURE_FEATURES.md`](./FUTURE_FEATURES.md) | Backlog de producto: implementado / parcial / pendiente. |
| [`SECURITY_IMPROVEMENTS.md`](./SECURITY_IMPROVEMENTS.md) | Permisos, protección de rutas, AuthProvider. |
| [`README.md`](./README.md) | Setup básico, variables de entorno, deploy. |
| [`README_SHOP_ITEMS.md`](./README_SHOP_ITEMS.md) | Detalle del sistema de ítems de tienda. |
</content>
</invoke>
