# Módulo 02 — Personajes

## Nombre y propósito

Creación, edición y consulta de personajes de D&D 5e: identidad, atributos,
especie/raza con rasgos, trasfondo, dotes de origen y notas. Es la entidad
central del sistema: el inventario, la economía y las campañas cuelgan del
personaje.

## Estado

🔶 **Parcial** — el ciclo de vida completo funciona (crear, editar, hoja,
archivar, notas), pero: solo los Origin Feats tienen datos (General/Combat
Style/Epic Boons devuelven listas vacías), la mayoría de rasgos raciales son
solo descriptivos, y hay anomalías en la persistencia del sistema de reglas
(ver hallazgos).

## Qué hace (perspectiva del usuario)

- Crear un personaje con nombre, especie/raza, clase, nivel (1–20), género,
  atributos (1–30), tamaño, trasfondo y dote de origen.
- Elegir el sistema de reglas: **PHB 2024** (por defecto) o **PHB 2014**.
- Ver la hoja del personaje con modificadores calculados y capacidad de carga.
- Escribir notas de preparación con historial de cambios.
- Archivar/desarchivar personajes sin borrar datos.
- Ver los personajes agrupados: asignados a campaña, libres y archivados.

## Cómo funciona

### Creación (`CharacterService.createCharacterWithDefaults`)

Entrada: formulario de `/characters/new` (`CharacterManagementView`).
Proceso:
1. Determina el sistema de reglas (`5e_2024` por defecto).
2. Resuelve los **rasgos raciales** de la especie/linaje elegido
   (`RacialTraitService`), el tamaño por defecto y los campos específicos
   (linaje de goliat, competencia de humano, subraza 2014).
3. Aplica los **bonos de característica**:
   - **PHB 2024**: elegidos por el usuario entre las opciones del **trasfondo**
     (`background_ability_bonuses`) — conforme a PHB 2024, donde los bonos
     vienen del trasfondo y no de la especie.
   - **PHB 2014**: calculados de **raza + subraza**
     (`getRacialAbilityBonuses2014`), con selección manual para humano variante
     y semielfo (`racial_ability_bonuses`).
4. Calcula la **capacidad de carga** y los `shop_bonuses` (ver nota abajo).
5. Persiste. ⚠️ **Anomalía**: siempre guarda `rules_system: "5e_2024"`, aunque
   el flujo usado haya sido el de 2014 (`character-service.ts:310`).
   ⚠️ Además, ninguna migración crea la columna `racial_ability_bonuses` que el
   código escribe (ver [hallazgos](../99-pendientes-y-hallazgos.md)).
6. Al insertarse el personaje, un **trigger de BD crea su monedero** en 0.

### Especies y razas con datos reales

- **PHB 2024** (10 especies): aasimar, dragonborn, elf, dwarf, gnome, goliath,
  human, halfling, orc, tiefling. Con **linajes**: elfo (alto/drow/bosque),
  gnomo (roca/bosque), tiefling (abisal/ctónico/infernal). El goliat elige
  linaje de gigante (6 opciones) por un mecanismo aparte
  (`goliath_giant_lineage`).
- **PHB 2014** (9 razas): dwarf, elf, halfling, human, dragonborn, gnome,
  half_elf, half_orc, tiefling — con bonos numéricos y subrazas.
  ⚠️ Dos rasgos 2014 (`stonecunning`, `dwarven_resilience`) apuntan a IDs que no
  existen en el catálogo de rasgos.

### Rasgos con efecto mecánico real vs solo texto

| Efecto | ¿Real? | Detalle |
|---|---|---|
| Capacidad de carga | ✅ | `powerful_build` / `goliath_power` suben el tamaño efectivo una categoría |
| Visión en la oscuridad | ✅ (solo display) | Rango por especie hardcodeado (elfo 18 m, enano 36 m, drow 36 m…) |
| Velocidad | ❌ solo texto | Los rasgos declaran `affects:["speed"]` pero ningún código consume velocidad |
| Descuento en tiendas | ❌ inoperante | La tubería existe pero **ninguna especie/rasgo define datos**: `getShopBonuses()` siempre devuelve `null` |
| Salvaciones, habilidades, hechizos raciales, aliento de dragón… | ❌ solo texto | No hay motor de tiradas/conjuros |

### Capacidad de carga

Fórmula (`lib/services/character-sheet-config.ts:276`):
`FUE × 15`, ajustada por tamaño efectivo — small ÷2, medium ×1, large ×2,
huge ×4; default 150 si no hay FUE.
⚠️ **Desviación de PHB 2024**: oficialmente Small y Medium tienen la misma
capacidad (solo Tiny divide entre 2); el ÷2 para Small es homebrew.
Modificador de característica: `⌊(valor − 10) / 2⌋` (oficial ✓).

### Dotes (Feats)

- **Origin Feats (nivel 1)**: 9 con datos (skilled, tough, alert, lucky,
  magic_initiate, musician, savage_attacker, tavern_brawler, weapon_master).
  Algunos con beneficios estructurados (competencias); otros solo descriptivos.
  `canTakeOriginFeat` valida nivel (solo 1) y prerrequisitos.
- **General Feats / Combat Style / Epic Boons**: 🔴 solo tipos e interfaces —
  los métodos devuelven `[]` (TODOs en `feat-service.ts`). Los niveles de
  General Feat están definidos: 4, 8, 12, 16, 19.

### Notas del personaje

`/characters/[id]/history` → `CharacterNotesPanel` + hook
`use-character-notes.ts`: notas de preparación (`preparation_notes`) con
historial de cambios.

### Edición y recálculo

`updateCharacterWithCalculations`: si cambian fuerza, tamaño, rasgos o especie,
recalcula capacidad de carga y shop_bonuses. `updateAbilityScores` valida
rango 1–30 por atributo.

### Validaciones principales

| Regla | Dónde |
|---|---|
| Nombre único **por usuario** (no global) | BD: `UNIQUE(user_id, name)` |
| Nivel 1..20, atributos 1..30, género male/female/other | CHECKs en BD |
| Solo el dueño ve/edita sus personajes | RLS por `user_id` + hub valida `user_id` en cliente |

## Datos que usa

| Operación | Tabla | Notas |
|---|---|---|
| CRUD | `characters` | todos los campos de la hoja |
| Escribe (indirecto) | `wallets` | trigger crea el monedero al crear personaje |
| Lee | `campaign_members` | para agrupar personajes asignados vs libres |

Catálogos estáticos en código (no BD): especies/razas/linajes y rasgos
(`racial-traits-service.ts`), dotes (`feat-service.ts`), fórmulas
(`character-sheet-config.ts`).

## Interacción con otros módulos

- **Inventario, Economía, Comercio**: operan siempre sobre un personaje.
- **Campañas**: el personaje se une a campañas; `characters.campaign_id` y
  `campaign_members.character_id` lo vinculan.
- **Comercio**: `shop_bonuses.discount_percent` alimenta el descuento (hoy
  inoperante por falta de datos).

## Archivos involucrados

`app/(app)/characters/**` (7 páginas activas + 3 cáscaras) ·
`components/features/character/*` (management, sheet-view, sheet-form,
summary, notes-panel, join-campaign) · `components/characters-unified.tsx`
(lista, legacy) · `lib/application/services/character-service.ts` ·
`lib/application/services/feat-service.ts` ·
`lib/services/racial-traits-service.ts` ·
`lib/services/character-sheet-config.ts` ·
`lib/application/utils/character-sheet.utils.ts` ·
`lib/infrastructure/repositories/character-repository.ts` ·
`hooks/use-character-notes.ts` · migraciones `002, 011, 036, 054, 065–070`
