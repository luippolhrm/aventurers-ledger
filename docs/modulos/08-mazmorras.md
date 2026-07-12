# Módulo 08 — Mazmorras

## Nombre y propósito

Extiende las ubicaciones de tipo "mazmorra" con una ficha de dungeon (nivel
recomendado, dificultad) y sus **salas** (tipos, orden, NPCs habitantes), como
herramienta de preparación del GM.

## Estado

🔶 **Parcial** — crear y ver dungeons/salas funciona; hay **botones "Editar" sin
acción** (TODOs) en varias vistas, y columnas preparadas para un mapa visual
(`map_data`, posiciones, conexiones) **sin ningún uso**.

## Qué hace (perspectiva del usuario)

- **GM**: crear una mazmorra de dos formas:
  1. Sobre una ubicación existente de tipo `dungeon`
     (`…/locations/[id]/dungeon/create`).
  2. Completa desde cero (`/campaigns/[id]/dungeons/new` crea ubicación +
     dungeon juntos).
- Definir nivel recomendado y dificultad (`easy`/`medium`/`hard`/`deadly`),
  marcar como limpiada (`is_cleared`) o inactiva.
- Crear **salas** con nombre, descripción, tipo (`entrance`, `combat`,
  `treasure`, `boss`, `puzzle`, `trap`) y orden.
- Asociar **NPCs** a las salas (ficha global o inline).
- Ver la lista de mazmorras de la campaña (ubicaciones tipo dungeon) y la vista
  unificada de una mazmorra con sus salas y tiendas de la ubicación.

## Cómo funciona

### Reglas del servicio (`DungeonService`)
- **Todas las mutaciones exigen ser GM** de la campaña; el permiso se resuelve
  con la cadena dungeon → location → campaign → `ensureGameMaster`.
- `createDungeon`: valida que la ubicación exista, que su `location_type` sea
  exactamente `"dungeon"` y que los IDs coincidan. Relación **1:1** con la
  ubicación (UNIQUE en BD).
- Salas: `createRoom`/`updateRoom`/`deleteRoom` validan nombre y pertenencia al
  dungeon.
- NPCs de sala: asociación/desasociación exige GM; escribe directo en
  `dungeon_room_npcs`.

### Navegación particular
- `…/locations/[locationId]/dungeon` es un **redirect puro** a la vista de la
  ubicación (la "vista unificada" muestra dungeon + salas ahí).
- La lista `/campaigns/[id]/dungeons` filtra las ubicaciones de tipo `dungeon`.

### Validaciones principales

| Regla | Dónde |
|---|---|
| Solo GM crea/edita/borra dungeons y salas | `ensureGameMaster` + RLS |
| Dungeon solo sobre ubicación tipo `dungeon` | `DungeonService.createDungeon` |
| 1 dungeon por ubicación | UNIQUE en BD |
| Tipos de sala y dificultad | ⚠️ **sin CHECK en BD** (convención del código/UI) |

## Datos que usa

| Tabla | Rol |
|---|---|
| `dungeons` | ficha (nivel, dificultad, is_cleared, is_active; `map_data` sin uso) |
| `dungeon_rooms` | salas (tipo, orden; `position_x/y`, `connections` sin uso) |
| `dungeon_room_npcs` | NPCs por sala |
| `locations` (lee) | la ubicación anfitriona |

## Interacción con otros módulos

- **Mundo**: nace de una ubicación tipo `dungeon`; la vista unificada muestra
  también las tiendas de esa ubicación.
- **NPCs**: las salas alojan NPCs; su botín se gestiona en el módulo 07.
- **Campañas**: permisos vía GM de la campaña.

## Archivos involucrados

`app/(app)/campaigns/[campaignId]/dungeons/page.tsx` + `new/page.tsx` ·
`app/(app)/campaigns/[campaignId]/locations/[locationId]/dungeon/**`
(redirect, create, rooms/new, rooms/[roomId]) ·
`components/features/dungeons/*` (full-create-view, create-view, dungeon-view,
unified-dungeon-view, room-create-view, room-view, room-form — con TODOs de
edición en `dungeon-view.tsx:165`, `dungeon-room-view.tsx:141`,
`unified-dungeon-view.tsx:78`) ·
`lib/application/services/dungeon-service.ts` ·
`lib/infrastructure/repositories/dungeon-repository.ts` ·
migraciones `071, 072, 073, 074, 077`
