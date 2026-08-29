# Módulo 06 — Mundo: ubicaciones y tiendas

## Nombre y propósito

Herramientas del Game Master para construir el mundo de la campaña: ubicaciones
(pueblos, ciudades, mazmorras…) y tiendas con su catálogo de objetos a la venta.

## Estado

✅ **Completo** — CRUD de ubicaciones, tiendas y catálogo funciona con permisos
de GM. Matices: los tipos de ubicación/tienda son convenciones sin CHECK en BD.

## Qué hace (perspectiva del usuario)

- **GM**: crear ubicaciones con nombre, descripción y tipo (pueblo, bosque,
  campamento, puerto, ruinas, ciudad, mazmorra); activarlas/desactivarlas
  (`is_active`); editar y borrar.
- **GM**: crear tiendas dentro de una ubicación, con tendero y tipo de tienda
  (taberna, tienda general, herrería, tienda mágica, puesto comercial).
- **GM**: gestionar el catálogo de cada tienda (`/shop-items/[shopId]` en modo
  gestor): objetos con precio en cobre, stock, rareza (común → artefacto),
  imagen, requisitos, sintonización, daño/CA, propiedades, efectos y hechizos
  contenidos.
- **Jugador**: explorar el mundo desde su tab "Mundo" y entrar a las tiendas a
  comprar (ver [módulo 09](./09-comercio.md)).

## Cómo funciona

### Ubicaciones (`LocationService`)
- `createLocation` / `updateLocation` / `deleteLocation`: todas **exigen ser GM**
  de la campaña (`ensureGameMaster`; en update/delete se resuelve la campaña
  cargando la ubicación primero). Validan nombre no vacío.
- El tipo `dungeon` habilita crear una mazmorra 1:1 sobre la ubicación
  (ver [módulo 08](./08-mazmorras.md)).

### Tiendas (`ShopService`)
- CRUD con validación de datos (nombre, location_id).
- ⚠️ **Particularidad**: `ShopService` **no valida permisos en código** — recibe
  `userId` pero no lo usa; la autorización recae **exclusivamente en RLS**
  (los GMs gestionan, los miembros ven). Es el único servicio de mundo con este
  patrón.

### Catálogo (`ShopItemService`)
- CRUD de `shop_items` con validaciones: precio ≥ 0, stock ≥ 0, nombre no vacío.
- `getAvailableShopItems`: solo objetos con stock > 0 (lo que ve el jugador).
- `updateStock`: ajusta stock (el descuento real en compras lo hace la RPC de
  checkout de forma atómica).

### Tipos de tienda (migración 078 — nomenclatura D&D 2024)

| Valor actual | Significado |
|---|---|
| `tavern` | Taberna/posada |
| `general_store` | Tienda general |
| `blacksmith` | Herrería |
| `magic_shop` | Tienda mágica |
| `trading_post` | Puesto de comercio |

Los valores antiguos (inn, general, smith, jewelry, market, atelier) fueron
migrados; sus etiquetas siguen en `lib/texts.ts` por compatibilidad.

### Validaciones principales

| Regla | Dónde |
|---|---|
| Solo el GM crea/edita/borra ubicaciones | `ensureGameMaster` + RLS |
| Solo el GM gestiona tiendas y catálogo | **solo RLS** (sin chequeo en código) |
| Miembros de la campaña pueden ver | RLS |
| Precio y stock no negativos | servicio + BD |
| Rareza válida (6 niveles) | CHECK en BD |

## Datos que usa

| Tabla | Rol |
|---|---|
| `locations` | ubicaciones de la campaña |
| `shops` | tiendas por ubicación |
| `shop_items` | catálogo por tienda |
| `shop_npcs` | tenderos/NPCs asociados (ver [módulo 07](./07-npcs.md)) |

## Interacción con otros módulos

- **Campañas**: todo pertenece a una campaña; permisos por su GM.
- **Comercio**: el catálogo alimenta carrito y checkout; el stock se descuenta
  al comprar.
- **Mazmorras**: las ubicaciones tipo `dungeon` son la puerta al módulo 08.
- **NPCs**: las tiendas pueden tener NPCs asociados.
- **Economía**: los movimientos de compra guardan tienda y ubicación para el
  historial.

## Archivos involucrados

`app/(app)/campaigns/[campaignId]/locations/**` (6 páginas) ·
`app/(app)/campaigns/[campaignId]/settings/page.tsx` ·
`app/(app)/shop-items/[shopId]/page.tsx` ·
`components/features/world/*` (world-view, location-view/create/form,
shop-view/create/form, shop-items-manager) ·
`components/features/campaigns/world-settings-view.tsx` ·
`components/shop-item-form.tsx` ·
`lib/application/services/location-service.ts` · `shop-service.ts` ·
`shop-item-service.ts` ·
`lib/infrastructure/repositories/location-repository.ts` ·
`shop-repository.ts` · `shop-item-repository.ts` ·
migraciones `034, 043, 044, 045, 063, 071, 076, 078`
