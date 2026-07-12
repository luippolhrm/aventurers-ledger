# Módulo 03 — Inventario

## Nombre y propósito

Gestión de los objetos del personaje: qué lleva, qué tiene equipado y en qué
slot, qué guarda en contenedores, cuánto pesa todo y cuánto vale.

## Estado

✅ **Completo** — CRUD, equipamiento por slots, contenedores con capacidad,
armas versátiles y límite de sintonización funcionan con lógica real.
Brecha conocida: **no hay enforcement de la capacidad de carga total** (se
muestra, pero se puede exceder). La mecánica *Weapon Mastery* de PHB 2024 tiene
columna en BD pero **ninguna lógica** que la consuma.

## Qué hace (perspectiva del usuario)

- Añadir, editar y eliminar objetos con categoría, peso, valor, descripción y
  campos específicos (daño, CA, efectos, hechizo contenido, propiedades de arma).
- Equipar objetos en **11 slots corporales**: cabeza, cuello, hombros, cuerpo,
  manos, cintura, anillo izquierdo/derecho, pies, arma principal, arma
  secundaria.
- Guardar objetos en **3 contenedores** (mochila, bolsa izquierda, bolsa
  derecha) con límite de capacidad en peso.
- Usar armas **versátiles** a una o dos manos, con el daño correspondiente.
- Ver el peso total, el valor total y el estado de la capacidad de carga
  (widget con barra de progreso).

Dónde se usa: la vista completa vive en los **tabs de campaña del jugador**
(`/campaigns/[id]` → tab Inventario). ⚠️ La ruta
`/characters/[id]/inventory` es una cáscara "en desarrollo".

## Cómo funciona

### Equipar (`InventoryService.equipItem`)
1. Valida que el objeto puede ir a ese slot: por categoría (arma → slots de
   arma, armadura → cuerpo, etc.) o por `wondrous_type` para objetos
   maravillosos (mapa en `lib/services/item-form-config.ts`: anillos → slots de
   anillo, botas → pies, capa → hombros…).
2. **Rechaza** equipar un objeto que esté dentro de un contenedor.
3. **Límite de sintonización**: máximo **3 objetos con `attunement` equipados**
   simultáneamente (conforme a PHB) — el cuarto se bloquea.
4. Si el slot estaba ocupado, **desequipa automáticamente** el objeto anterior.

### Contenedores (`storeInContainer`)
- Solo se puede guardar en items con `is_container = true`.
- Rechaza: guardarse a sí mismo, guardar objetos equipados, y exceder la
  **capacidad disponible** (`container_capacity − peso ya usado`, con
  `peso × cantidad` del objeto entrante).
- La capacidad es un dato **por objeto** (columna en BD), no un valor fijo.

### Armas versátiles
- `setVersatileUsage(item, "one-handed" | "two-handed")`: solo armas versátiles
  equipadas en mano principal; **rechaza dos manos si la secundaria está
  ocupada**.
- El daño mostrado (`getCurrentWeaponDamage`) usa `damage_dice_versatile` cuando
  el arma se usa a dos manos; si no hay uso explícito, **infiere** dos manos
  cuando la mano secundaria está libre.
  (`lib/application/utils/weapon-properties.utils.ts`)

### Cantidades
`createMultipleItems`: si se añade cantidad N > 1, se crean **N filas
individuales** de cantidad 1 (no una fila con quantity N).

### Peso y valor
- `calculateTotalWeight` / `calculateTotalValue` suman `peso × cantidad` y
  `value_in_copper × cantidad`.
- El widget de capacidad de carga muestra 4 estados (ligero/medio/pesado/
  sobrecargado) pero **es solo informativo**: `createItem` no bloquea al
  superar `carrying_capacity`.

### Validaciones principales

| Regla | Resultado si falla |
|---|---|
| Slot compatible con la categoría del objeto | Rechazo |
| Objeto en contenedor no se puede equipar | Rechazo |
| Máx. 3 objetos sintonizados equipados | Rechazo del 4º |
| Capacidad del contenedor en peso | Rechazo |
| Arma a dos manos con mano secundaria ocupada | Rechazo |
| quantity > 0, weight ≥ 0, value ≥ 0 | CHECKs en BD |

## Datos que usa

Tabla `inventory` (una fila por objeto). Campos funcionales:

| Grupo | Campos |
|---|---|
| Identidad | item_name, item_type, item_category, description, quantity |
| Físico | weight, value_in_copper |
| Equipamiento | equipped, equipped_slot, equippable_slot, wondrous_type |
| Contenedores | container_id (FK a sí misma), is_container, container_capacity |
| Armas | damage_dice, damage_type, damage_dice_versatile, versatile_usage, weapon_range_normal/long, properties (JSONB), weapon_mastery (⚠️ sin lógica) |
| Efectos/hechizos | effect_dice/type/target/description, spell_level (0–9), spell_name, spell_school, armor_class, attunement |

RLS: cada usuario accede solo al inventario de sus personajes.

## Interacción con otros módulos

- **Personajes**: pertenece a un personaje; usa su `carrying_capacity` para el
  widget.
- **Comercio**: la compra (`process_purchase`) inserta los objetos comprados en
  `inventory`.
- **NPCs**: la distribución de botín copia items de `npc_inventory` a
  `inventory`.

## Archivos involucrados

`components/features/inventory/inventory-view.tsx` (vista principal, 686 líneas)
· `components/features/inventory/use-inventory-data.tsx` ·
`components/inventory.tsx` (wrapper legacy usado por los tabs de campaña) ·
`lib/application/services/inventory-service.ts` ·
`lib/application/utils/weapon-properties.utils.ts` ·
`lib/services/item-form-config.ts` ·
`lib/infrastructure/repositories/inventory-repository.ts` ·
migraciones `012, 013, 014, 064, 081, 082, 083, 084`
