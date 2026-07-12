# 02 — Arquitectura funcional

## 1. Capas de la aplicación

```
Usuario
  → Páginas (app/…/page.tsx) + Componentes (components/)
     → Servicios de aplicación (lib/application/services/ — la lógica de negocio)
        → Repositorios (lib/infrastructure/repositories/ — acceso a datos)
           → Supabase (Postgres + RLS + RPCs + triggers)
```

- Los componentes obtienen los servicios con el hook `useServices()`
  (`hooks/use-services.ts`).
- Los servicios validan entradas (`ValidationUtils`) y permisos
  (`PermissionUtils`) y orquestan repositorios.
- Los repositorios traducen a consultas Supabase; los errores de Postgres se
  normalizan con `ErrorService` (ver §6).
- Excepción al patrón: `DungeonService` y `NpcService` hacen algunos
  inserts/deletes directos con el cliente Supabase sobre las tablas de
  asociación (`dungeon_room_npcs`, `shop_npcs`), sin pasar por repositorio.

### Dos generaciones de UI conviven

| Generación | Ubicación | Ejemplos vivos |
|---|---|---|
| **Legacy** | `components/*.tsx` (raíz) | `dashboard-overview`, `campaigns`, `characters-unified`, `campaign-view`, `wallet-manager`, `inventory`, `movements`, `shopping-cart`, `shop-catalog`, `currency-exchange-card` |
| **Features** | `components/features/<dominio>/` | Todas las vistas de character, world, dungeons, npcs, campaigns nuevas |

Varias rutas montan directamente componentes legacy (el dashboard y los tabs del
jugador en campaña), y algunos legacy están marcados `@deprecated` pero siguen en
uso. El detalle de cuáles están muertos está en
[99 — Pendientes y hallazgos](./99-pendientes-y-hallazgos.md).

## 2. Mapa de pantallas y navegación

### Zona pública (`app/auth/`)

| Ruta | Pantalla |
|---|---|
| `/auth/login` | Login con email+contraseña o Google; enlaza a registro |
| `/auth/sign-up` | Registro (nombre, email, contraseña ×2) o Google |
| `/auth/sign-up-success` | Aviso "revisa tu correo" (texto en inglés, sin i18n) |
| `/auth/callback` | Endpoint OAuth: intercambia el código por sesión y redirige a `/dashboard` |

### Zona protegida (`app/(app)/` — envuelta en `ProtectedRoute` + sidebar)

**Dashboard y raíz**

| Ruta | Pantalla |
|---|---|
| `/` | Redirige a `/dashboard` (middleware y cliente) |
| `/dashboard` | Vista conmutada por query `?module=`: `welcome` (resumen), `campaigns`, `characters`, `currency-converter` (este último sin enlace visible en la UI) |

**Personajes**

| Ruta | Pantalla |
|---|---|
| `/characters` | Lista unificada (asignados a campaña / libres / archivados) |
| `/characters/new` | Crear personaje |
| `/characters/[id]` | Hub del personaje: 4 tarjetas de navegación (Hoja, Inventario, Historia, Mis Campañas) |
| `/characters/[id]/sheet` | Hoja de personaje (stats, especie, trasfondo) |
| `/characters/[id]/edit` | Edición |
| `/characters/[id]/history` | Notas del personaje con historial |
| `/characters/[id]/join-campaign` | Unir el personaje a una campaña por código |
| `/characters/[id]/inventory` · `/story` · `/campaigns` | ⚠️ **Cáscaras**: muestran "en desarrollo". El inventario real se usa desde los tabs de campaña |

**Campañas y mundo**

| Ruta | Pantalla |
|---|---|
| `/campaigns` | Lista de campañas donde el usuario es GM |
| `/campaigns/new` | Crear campaña |
| `/campaigns/[id]` | Hub: si GM → tarjetas (Miembros, Explorar Mundo, Configuración); si jugador → tabs (Resumen, Monedero, Inventario, Movimientos, Mundo) |
| `/campaigns/[id]/admin` | ⚠️ Redirect puro al hub |
| `/campaigns/[id]/members` | Gestión de miembros |
| `/campaigns/[id]/settings` | Ajustes del mundo (crear ubicaciones/mazmorras) |
| `/campaigns/[id]/locations` | Mundo: tarjetas (Ubicaciones, Mazmorras, NPCs) + vista del mundo |
| `/campaigns/[id]/locations/new` · `[locationId]` | Crear/ver ubicación |
| `…/locations/[id]/shops/new` · `[shopId]` | Crear/ver tienda |
| `…/shops/[shopId]/npcs/new` · `[npcId]` | Crear/ver NPC de tienda |
| `/campaigns/[id]/npcs` · `/new` · `[npcId]` · `[npcId]/loot` | NPCs de campaña y su botín |
| `/campaigns/[id]/dungeons` · `/new` | Lista/creación de mazmorras |
| `…/locations/[id]/dungeon` | ⚠️ Redirect puro a la ubicación |
| `…/dungeon/create` · `…/dungeon/rooms/new` · `…/rooms/[roomId]` | Crear dungeon, crear sala, ver sala |

**Comercio, perfil y otros**

| Ruta | Pantalla |
|---|---|
| `/shop-items/[shopId]` | Si GM → gestor de items de la tienda; si jugador → catálogo + carrito |
| `/profile` | Cuenta: nombre visible, cambio de contraseña (oculto para cuentas Google) |
| `/settings` | ⚠️ Cáscara: "próximamente" |
| `/test-services` | ⚠️ Herramienta interna de QA de servicios (no enlazada) |

### Protección de rutas (dos niveles)

1. **Middleware** (`proxy.ts` → `lib/supabase/proxy.ts:updateSession`): refresca la
   sesión en cada request y redirige a nivel edge: sin sesión en
   `/dashboard|/profile|/settings` → login; con sesión en login/sign-up →
   dashboard; `/` → según sesión. Nota: `/characters/*` y `/campaigns/*` **no**
   están en la lista del middleware; su protección recae en el nivel 2.
2. **Cliente** (`components/auth/protected-route.tsx` en `app/(app)/layout.tsx`):
   sin usuario → `router.push("/auth/login")`.

## 3. Modelo de datos (estado final en Supabase)

Reconstruido acumulando las migraciones de `scripts/` en orden. 19 tablas activas.
Convención: todas tienen `id UUID PK` y timestamps salvo indicación.

### Identidad

**`profiles`** (1:1 con `auth.users`; creado por trigger al registrarse)
| Columna | Tipo | Notas |
|---|---|---|
| id | UUID PK | FK → auth.users, CASCADE |
| display_name | TEXT | |
| username | TEXT | único (índice parcial cuando no es NULL); autogenerado en el registro |

### Personajes y economía

**`characters`**
| Columna | Tipo | Notas |
|---|---|---|
| user_id | UUID | FK → auth.users, CASCADE |
| name | TEXT NOT NULL | único por usuario (`UNIQUE(user_id, name)`) |
| race, class, alignment, background | TEXT | |
| level | INTEGER DEFAULT 1 | CHECK 1..20 |
| experience_points | INTEGER DEFAULT 0 | |
| gender | TEXT | CHECK male/female/other |
| archived | BOOLEAN DEFAULT FALSE | archivado sin borrar |
| campaign_id | UUID | FK → campaigns, SET NULL |
| strength…charisma (6) | INTEGER (nullable) | CHECK 1..30; sin default |
| size | TEXT DEFAULT 'medium' | CHECK small/medium/large |
| carrying_capacity | INTEGER DEFAULT 150 | recalculado por la app |
| preparation_notes, avatar_url | TEXT | |
| racial_traits | TEXT[] DEFAULT '{}' | IDs de rasgos |
| character_background | TEXT | trasfondo D&D 2024 (distinto de `background`) |
| background_ability_bonuses | JSONB DEFAULT '{}' | bonos 2024 (por trasfondo) |
| racial_ability_bonuses | — | ⚠️ usado por el código TS; **no aparece en las migraciones leídas** — ver hallazgos |
| rules_system | TEXT DEFAULT '5e_2024' | CHECK 5e_2014/5e_2024 |
| shop_bonuses | JSONB DEFAULT '{}' | `discount_percent` para descuento en tiendas |
| subrace, selected_lineage | TEXT | 2014 / linajes 2024 |
| human_skill_proficiency, selected_origin_feat, goliath_giant_lineage | TEXT | campos específicos |

Columnas **eliminadas** definitivamente (migración 036): max/current_hit_points,
armor_class, speed, initiative_bonus, physical_description, personality_traits,
backstory.

**`wallets`** (1:1 con characters; creado por trigger al crear el personaje)
| Columna | Tipo | Notas |
|---|---|---|
| character_id | UUID UNIQUE NOT NULL | FK CASCADE |
| platinum, gold, electrum, silver, copper | INTEGER DEFAULT 0 | |
| total_wealth | DECIMAL(10,2) | calculado por trigger en cada write |

**`movements`** — historial financiero del personaje
| Columna | Tipo | Notas |
|---|---|---|
| character_id | UUID NOT NULL | FK CASCADE |
| from_currency, to_currency | TEXT | CHECK PP/GP/EP/SP/CP |
| amount_from, amount_to | DECIMAL(10,2) | CHECK ≠ 0 (negativos permitidos) |
| movement_type | TEXT DEFAULT 'conversion' | CHECK add/remove/conversion/purchase |
| description | TEXT | |
| shop_id, location_id | UUID | FK SET NULL (contexto de compras) |

**`transfers`** — envíos de moneda entre personajes
| Columna | Tipo | Notas |
|---|---|---|
| from_character_id, to_character_id | UUID NOT NULL | FK CASCADE; CHECK from ≠ to |
| currency | VARCHAR(2) | CHECK PP/GP/EP/SP/CP |
| amount | NUMERIC(10,2) | CHECK > 0 |
| description | TEXT | |

**`inventory`** — items del personaje (ver detalle de campos de efectos/armas en [módulo 03](./modulos/03-inventario.md))
Campos clave: item_name, item_type, item_category, quantity (CHECK >0), weight,
value_in_copper, equipped, equipped_slot, equippable_slot, container_id (FK a sí
misma), is_container, container_capacity, wondrous_type, effect_*, spell_*,
damage_*, armor_class, attunement, weapon_mastery, properties (JSONB),
damage_dice_versatile, versatile_usage (CHECK one-handed/two-handed),
weapon_range_normal/long.

### Campañas

**`campaigns`**
| Columna | Tipo | Notas |
|---|---|---|
| name | TEXT NOT NULL | |
| description | TEXT | |
| game_master_id | UUID NOT NULL | FK → auth.users — **fuente de verdad del rol GM** |
| status | TEXT DEFAULT 'active' | CHECK active/paused/completed/archived |
| invite_code | TEXT UNIQUE | autogenerado por trigger |

**`campaign_members`**
| Columna | Tipo | Notas |
|---|---|---|
| campaign_id, user_id | UUID NOT NULL | FK CASCADE |
| character_id | UUID | FK CASCADE; NULL para el GM |
| role | TEXT | CHECK game_master/player |
| — | | UNIQUE(campaign_id, user_id, character_id) |

**`campaign_invitations`** — ⚠️ **subsistema fantasma**: tabla completa con
políticas RLS y 4 RPCs, pero **ningún código TS la usa**. El flujo real de unión
es por `invite_code`. Ver hallazgos.

### Mundo

**`locations`**: name, description, campaign_id (FK CASCADE), location_type
(convención sin CHECK: village/forest/camp/port/ruins/city/dungeon), is_active.

**`shops`**: name, description, location_id (FK CASCADE), shopkeeper_name,
shop_type (sin CHECK; valores actuales tras migración 078: tavern, general_store,
blacksmith, magic_shop, trading_post).

**`shop_items`**: catálogo de una tienda — item_name, item_type, item_category,
description, price_in_copper, weight, quantity_available (DEFAULT 999), image_url,
rarity (CHECK common…artifact), damage_*, armor_class, properties (JSONB),
requirements, attunement, original_name_en, source (CHECK: solo 'manual'),
equippable_slot, wondrous_type, effect_*, spell_* .

**`npcs`**: campaign_id (FK CASCADE), name, title, resistances, story.
**`shop_npcs`**: asociación tienda↔NPC (npc_id FK SET NULL) + datos inline.
**`npc_inventory`**: items del NPC — item_name, item_type (incluye tipo especial
`currency`), quantity, weight, value_in_copper, description.

### Mazmorras

**`dungeons`** (1:1 con una location de tipo dungeon): location_id UNIQUE,
recommended_level, difficulty_level (convención: easy/medium/hard/deadly),
is_cleared, is_active, map_data (JSONB, sin uso).
**`dungeon_rooms`**: dungeon_id, name, description, room_type (convención:
entrance/combat/treasure/boss/puzzle/trap), order_index, position_x/y y
connections (sin uso).
**`dungeon_room_npcs`**: sala↔NPC (npc_id FK SET NULL o datos inline; CHECK
npc_id o name presentes).

### Comercio

**`shopping_carts`**: character_id + shop_id (UNIQUE juntos).
**`shopping_cart_items`**: cart_id + shop_item_id (UNIQUE juntos), quantity.
**`purchase_history`**: registro por línea de compra (character, shop, item,
quantity, price_per_unit, total_price). ⚠️ Solo la escribe el RPC de compra;
ninguna pantalla la lee hoy.

## 4. Funciones RPC y triggers

### Triggers activos

| Trigger | Tabla | Qué hace |
|---|---|---|
| `on_auth_user_created` | auth.users | Crea el `profile` (display_name + username autogenerado). SECURITY DEFINER |
| `create_wallet_after_character_insert` | characters | Crea el wallet en 0 |
| `update_wallets_metadata` | wallets | Recalcula `total_wealth` y `updated_at` en cada write |
| `trigger_sync_movements_to_wallet` | movements | Al insertar un movimiento, recalcula el wallet desde el historial — **excepto** tipo `purchase` (la compra actualiza el wallet directamente) |
| `trigger_set_invite_code` | campaigns | Genera el código de invitación |
| `trigger_update_*_updated_at` | varias | Mantienen `updated_at` |

### RPCs usadas por la aplicación

| Función | Seguridad | Uso |
|---|---|---|
| `process_purchase(character, shop, cart_items, descripción)` | SECURITY DEFINER | **Compra atómica** (ver [módulo 09](./modulos/09-comercio.md)). Versión vigente: `scripts/079_process_purchase_shop_discount.sql` |
| `calculate_wallet_deduction(...)` | normal | Deducción inteligente priorizando PP>GP>EP>SP>CP (usada por process_purchase) |
| `get_campaign_members(campaign)` | SECURITY DEFINER | Lista miembros verificando que el caller sea GM o miembro (evita recursión RLS) |
| `get_campaign_character_names(campaign, ids)` | SECURITY DEFINER | Nombres de personajes para la vista de miembros |

### RPCs existentes en BD pero **sin uso** en la app

`accept_campaign_invitation`, `find_campaign_id_by_invite_code`,
`get_current_user_email`, `user_has_pending_invitation_to_campaign` — todas del
subsistema fantasma de invitaciones.

## 5. Seguridad y permisos

**Modelo de doble capa** (defensa en profundidad):

1. **RLS en Postgres** — activo en **todas** las tablas. Patrón: los jugadores
   acceden a lo suyo vía `user_id` (o la cadena `characters.user_id`); los GMs
   gestionan el contenido de su campaña vía `campaigns.game_master_id`. Las
   políticas de `campaign_members` son deliberadamente no-relacionales (solo
   `user_id = auth.uid()`) para evitar recursión infinita; el acceso ampliado va
   por la RPC `get_campaign_members`.
2. **Capa de aplicación** — `lib/application/utils/permissions.ts`
   (`PermissionUtils`): `ensureGameMaster`, `ensureCharacterOwner`,
   `ensureCampaignAccess`, `ensureCampaignMemberWithCharacter` y variantes
   booleanas. La fuente de verdad del rol GM es `campaigns.game_master_id`
   (no la tabla de roles legacy).

Excepciones documentadas: `ShopService` no valida permisos en código (confía solo
en RLS); `NpcService.distributeItemToPlayer` tiene un hueco (ver hallazgos).

## 6. Sistema de errores

`lib/infrastructure/errors/`:
- **`ErrorCode`**: enum de ~30 códigos por dominio (WALLET_NOT_FOUND,
  INSUFFICIENT_FUNDS, CHARACTER_ACCESS_DENIED, CAMPAIGN_ACCESS_DENIED,
  VALIDATION_ERROR…).
- **`AppError`**: clase con code, message, details, originalError.
- **`ErrorService`**: crea AppError con **mensajes en español**; mapea códigos de
  Postgres (PGRST116→NOT_FOUND, 23505→duplicado, 23503→FK inválida, 42501→
  FORBIDDEN…) y errores de Supabase Auth (por status y texto del mensaje).

## 7. Flujo de datos típico (ejemplo real: compra en tienda)

1. El jugador abre `/shop-items/[shopId]` → `ShopCatalog` (catálogo) +
   `ShoppingCart` (carrito).
2. `useShoppingCart(shopId, characterId)` orquesta contra
   `ShoppingCartService`.
3. Al pagar: `validateCheckout` (7 validaciones en TS) → RPC `process_purchase`
   (transacción única en Postgres: stock, inventario, wallet, historial,
   movimiento, vaciado de carrito).
4. El trigger de wallets recalcula `total_wealth`; la UI recarga el saldo.
