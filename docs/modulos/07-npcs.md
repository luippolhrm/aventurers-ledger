# Módulo 07 — NPCs

## Nombre y propósito

Personajes no jugadores de la campaña: se crean una vez, se asocian a tiendas o
salas de mazmorra, y tienen inventario propio cuyo botín (objetos y monedas) el
GM puede **distribuir** a los jugadores.

## Estado

🔶 **Parcial** — CRUD, asociaciones e inventario funcionan. Dos brechas
importantes en la distribución de botín: un **hueco de permisos** (distribuir
objetos no bloquea a no-GMs) y un **bug de moneda** (distribuir una fracción
borra toda la moneda del NPC). Además el botón de añadir item desde una sección
de UI tiene un TODO sin modal.

## Qué hace (perspectiva del usuario)

- **GM**: crear NPCs de campaña con nombre, título, resistencias e historia.
- **GM**: asociar un NPC a una o varias **tiendas** (tendero) y/o **salas de
  mazmorra** (habitante). También pueden existir NPCs "inline" creados
  directamente en una tienda o sala sin ficha global.
- **GM**: darle al NPC un **inventario propio** (objetos con tipo, peso, valor;
  incluye el tipo especial `currency` para su dinero).
- **GM**: desde la vista de **botín** (`/campaigns/[id]/npcs/[npcId]/loot`),
  **entregar objetos** a un personaje jugador (descuenta del NPC, aparece en el
  inventario del jugador) y **repartir monedas** (suma al monedero del jugador).
- Ver lista de NPCs de la campaña con sus asignaciones (a qué tiendas/salas).

## Cómo funciona

### CRUD y asociaciones (`NpcService`)
- Crear/editar/borrar NPC: **exige ser GM** de `npc.campaign_id`.
- Asociar/desasociar a tienda o sala: exige GM; el servicio escribe
  **directamente** en las tablas `shop_npcs` / `dungeon_room_npcs` con el
  cliente Supabase (sin repositorio intermedio).
- `getNpcsWithAssignments`: lista con nombres de tiendas/mazmorras asociadas.

### Inventario del NPC
- `addItemToNpc` / `updateNpcItem` / `removeItemFromNpc`: exigen GM; validan
  cantidad > 0, peso/valor ≥ 0.

### Distribución de objetos (`distributeItemToPlayer`)
1. Verifica que el objeto pertenece al NPC y que hay **cantidad suficiente**
   (error `INSUFFICIENT_QUANTITY`).
2. Crea el objeto en el inventario del personaje receptor.
3. Descuenta la cantidad del NPC (o elimina la fila si llega a 0).
4. ⚠️ **Hueco de permisos**: el código calcula `isGameMaster` pero **no bloquea**
   si no lo es (hay un TODO explícito en `npc-service.ts:421`). La protección
   efectiva queda en las políticas RLS.

### Distribución de moneda (`distributeCurrencyToPlayer`)
1. Suma el valor de los items `item_type === "currency"` del NPC.
2. Rechaza si el total es menor a lo pedido (`INSUFFICIENT_FUNDS`); exige GM.
3. Descompone la cantidad en PP/GP/EP/SP/CP (divisiones enteras 1000/100/50/10/1)
   y la suma al monedero del jugador.
4. ⚠️ **Bug conocido**: después **elimina TODOS los items de moneda del NPC**,
   aunque se haya distribuido solo una fracción (el propio código lo comenta
   como simplificación).

### Validaciones principales

| Regla | Dónde |
|---|---|
| Solo el GM crea/edita/borra NPCs y su inventario | `ensureGameMaster` + RLS |
| Cantidad suficiente al distribuir | servicio |
| Distribuir objetos: bloqueo a no-GM | ⚠️ **solo RLS** (hueco en código) |
| NPC de sala: debe tener ficha global o nombre inline | CHECK en BD |

## Datos que usa

| Tabla | Rol |
|---|---|
| `npcs` | ficha global del NPC (por campaña) |
| `shop_npcs` | asociación a tiendas (o NPC inline de tienda) |
| `dungeon_room_npcs` | asociación a salas (o NPC inline de sala) |
| `npc_inventory` | objetos y moneda del NPC |
| `inventory` (escribe) | al distribuir objetos al jugador |
| `wallets` (escribe) | al distribuir moneda al jugador |

## Interacción con otros módulos

- **Campañas**: los NPCs pertenecen a una campaña; permisos por su GM.
- **Mundo**: asociación a tiendas; **Mazmorras**: asociación a salas.
- **Inventario/Economía del jugador**: destino de la distribución de botín.

## Archivos involucrados

`app/(app)/campaigns/[campaignId]/npcs/**` (4 páginas; ⚠️ el botón "editar"
navega a `/npcs/[id]/edit`, ruta que **no existe**) ·
`components/features/npcs/*` (npc-list-view, npc-detail-view, npc-loot-view) ·
`components/features/world/npc-view.tsx` · `npc-create-view.tsx` ·
`npc-form.tsx` · `shop-npc-create-view.tsx` ·
`components/molecules/npcs/*` (inventory-section — TODO modal —,
dungeon-room-association) ·
`lib/application/services/npc-service.ts` ·
`lib/infrastructure/repositories/npc-repository.ts` ·
`npc-inventory-repository.ts` · migraciones `043, 046, 074, 075`
