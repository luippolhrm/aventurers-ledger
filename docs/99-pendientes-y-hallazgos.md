# 99 — Pendientes y hallazgos

Inventario de todo lo que está a medias, muerto, inconsistente o requiere una
decisión de producto. Verificado contra el código en julio de 2026.

---

## 1. Decisiones de producto pendientes

### 1.1 El descuento racial de tienda nunca se aplica
Toda la tubería existe y es coherente (carrito TS y RPC `process_purchase` leen
`characters.shop_bonuses.discount_percent` con la misma fórmula), pero
`RacialTraitService.getShopBonuses()` (`lib/services/racial-traits-service.ts:1065`)
**siempre devuelve `null`** porque ninguna especie ni rasgo define
`shopBonuses`/`shopEffects` con datos. Resultado: ningún personaje tiene
descuento jamás.
**Decisión**: ¿qué especies/rasgos deberían dar descuento y de cuánto? (o
retirar la mecánica).

### 1.2 `rules_system` forzado a `"5e_2024"`
`character-service.ts:310` guarda siempre `rules_system: "5e_2024"` con el
comentario "Siempre usar PHB 2024", aunque el flujo completo de PHB 2014
(razas, subrazas, bonos raciales) existe y se ejecuta.
**Decisión**: ¿el sistema 2014 debe persistirse como tal, o 2014 está
descontinuado y su código debería retirarse?

### 1.3 Subsistema fantasma de invitaciones
`campaign_invitations` (tabla + 5 políticas RLS + 4 RPCs:
`accept_campaign_invitation`, `find_campaign_id_by_invite_code`,
`get_current_user_email`, `user_has_pending_invitation_to_campaign`) existe
completo en BD y **ningún código TS lo usa**. El flujo real es el código de
invitación. Hay textos de invitación en `lib/translations.ts` sin pantalla.
**Decisión**: implementar invitaciones dirigidas o limpiar BD.

### 1.4 `purchase_history` se escribe pero nunca se lee
La RPC de compra inserta el historial por línea, pero no existe ninguna
pantalla ni consulta que lo muestre.
**Decisión**: ¿pantalla de historial de compras, o basta con `movements`?

### 1.5 Enforcement de capacidad de carga
El cálculo y el widget existen; `InventoryService.createItem` **no bloquea** al
exceder `carrying_capacity` (documentado también en `FUTURE_FEATURES.md`).

---

## 2. Bugs y huecos verificados

| # | Hallazgo | Ubicación | Impacto |
|---|---|---|---|
| 2.1 | **Columna `racial_ability_bonuses` sin migración**: el código la escribe (`character-service.ts`, `character-repository.ts`) pero **ningún script SQL la crea**. O existe creada a mano en la BD real (sin migración versionada), o crear un personaje 2014 falla en runtime. | `scripts/` (ausente) | Alto — ⚠️ Por verificar contra la BD real |
| 2.2 | **Hueco de permisos en distribución de objetos**: `distributeItemToPlayer` calcula `isGameMaster` pero no bloquea a no-GMs (TODO abierto). Protección efectiva solo por RLS. | `npc-service.ts:421` | Medio |
| 2.3 | **Distribuir moneda borra todo el oro del NPC**: tras repartir una fracción, elimina TODOS los items `currency` del NPC (comentado como simplificación). | `npc-service.ts` (distributeCurrencyToPlayer) | Medio |
| 2.4 | **Transferencias no atómicas**: resta, suma y registro en 3 operaciones separadas sin transacción; un fallo intermedio deja estado inconsistente. | `transfer-service.ts` | Medio |
| 2.5 | **Enlace roto**: "Editar NPC" navega a `/campaigns/[id]/npcs/[id]/edit`, ruta sin `page.tsx` (404). | `features/npcs/npc-detail-view.tsx` | Bajo |
| 2.6 | **Posible índice fallido en migraciones**: `083` crea un índice sobre `properties` con operador de array, pero la columna se crea en `084` y es JSONB (operador incompatible). | `scripts/083…` / `084…` | ⚠️ Por verificar en BD real |
| 2.7 | **Traits 2014 con IDs muertos**: `stonecunning` y `dwarven_resilience` apuntan a rasgos inexistentes en el catálogo. | `racial-traits-service.ts:1107` | Bajo |
| 2.8 | Personaje 2024 con `characters.size` CHECK small/medium/large en BD, pero el código maneja también `huge` (goliat con linaje). Insertar `huge` violaría el CHECK. | `scripts/065` vs código | ⚠️ Por verificar |

---

## 3. Desviaciones de reglas D&D (referencia: PHB 2024)

| Regla en el código | Oficial 2024 | Veredicto |
|---|---|---|
| Capacidad de carga: Small ÷ 2 | Small = Medium (solo Tiny divide) | **Homebrew** (`character-sheet-config.ts:297`) |
| Capacidad: FUE×15, Large ×2, Huge ×4 | Igual | ✅ Correcto |
| Tasas de moneda (PP 1000 / GP 100 / EP 50 / SP 10 / CP 1) | Igual | ✅ Correcto |
| Límite de 3 objetos sintonizados | Igual | ✅ Correcto |
| Bonos de característica 2024 por trasfondo | Igual | ✅ Correcto |
| **Weapon Mastery** | Mecánica central 2024 | **Ausente** (columna `inventory.weapon_mastery` existe desde `082`, sin ninguna lógica) |
| Rasgos de velocidad, salvaciones, hechizos raciales, aliento | Efectos mecánicos | **Solo texto** (sin motor que los consuma) |
| Dotes General / Combat Style / Epic Boons | Catálogos 2024 | **Solo tipos**, métodos devuelven `[]` |

---

## 4. TODOs en el código

| Archivo:línea | Pendiente |
|---|---|
| `lib/application/services/feat-service.ts:200` | ~35 Origin Feats más del PHB 2024 |
| `feat-service.ts:338 / :361 / :372` | Implementar General Feats / Combat Style / Epic Boons |
| `lib/application/services/npc-service.ts:421` | Validación de acceso al personaje al distribuir |
| `components/molecules/npcs/npc-inventory-section.tsx:86` | Modal de agregar item (botón sin acción) |
| `components/features/dungeons/unified-dungeon-view.tsx:78` | Edición inline/modal de dungeon |
| `components/features/dungeons/dungeon-room-view.tsx:141` | Botón "Editar" sala sin acción |
| `components/features/dungeons/dungeon-view.tsx:165` | Botón "Editar" dungeon sin acción |
| `components/characters-unified.tsx:10` | Eliminar sistema de selección legacy |

`@deprecated` activos (marcados pero **aún en uso**): `components/inventory.tsx`,
`components/wallet-manager.tsx`, `components/campaign-world-view.tsx`;
`racial-traits-service.ts` (interfaz `OriginFeat` y 2 métodos que delegan a
`FeatService`).

---

## 5. Código muerto (verificado por ausencia de importadores)

| Elemento | Nota |
|---|---|
| `lib/services/shopping-cart-service.ts` | Duplicado viejo del servicio de carrito (hasta llama a la misma RPC); cero imports |
| `components/finances.tsx` → `features/finances/finances-view.tsx` | Cadena completa sin ruta que la monte |
| `components/features/inventory/inventory-equipped-view.tsx` | Exportado, sin uso detectado |
| `components/locations.tsx`, `locations-map.tsx`, `map.tsx`, `shops.tsx` | Sustituidos por `organisms/world/*` y `features/world/*` |
| `components/character-campaign-selector.tsx` | Sin importadores |
| `components/campaign-admin-view.tsx` | La ruta `/admin` redirige sin usarlo |
| `components/adventurer-card.tsx`, `components/user-menu.tsx` | Sin importadores |
| `lib/translations.ts` (parcial) | ~3.000 líneas; solo el conversor usa los nombres de moneda |
| `components/features/dashboard/dashboard-view.tsx` | Paralelo al legacy que sí se monta — ⚠️ decidir cuál sobrevive |

## 6. Librerías instaladas sin un solo import

`openai` · `@google/generative-ai` (IA planeada, nunca implementada) ·
`recharts` · `embla-carousel-react`. Candidatas a desinstalar del
`package.json` o a justificar con features futuras.

## 7. Páginas cáscara y rutas especiales

| Ruta | Situación |
|---|---|
| `/characters/[id]/inventory` · `/story` · `/campaigns` | "En desarrollo" (EmptyState); el inventario real vive en los tabs de campaña |
| `/settings` | "Próximamente" |
| `/campaigns/[id]/admin` y `…/locations/[id]/dungeon` | Redirects puros |
| `/test-services` | Herramienta interna de QA — **retirar antes de producción** (pendiente ya registrado) |
| `/dashboard?module=currency-converter` | Funcional pero sin enlace visible en la UI |

## 8. Inconsistencias menores

- Tasas de conversión **duplicadas** en `CurrencyConverterService` y
  `WalletService.calculateTotalInCopper`.
- `<html lang="en">` en `app/layout.tsx` con una app en español;
  `/auth/sign-up-success` con texto en inglés fuera del i18n.
- Dos generaciones de UI conviven (legacy `components/*` vs
  `components/features/*`); varias rutas montan legacy directamente.
- `location_type`, `shop_type`, `dungeons.difficulty_level` y
  `dungeon_rooms.room_type` son convenciones **sin CHECK** en BD.
- `movements` permite montos negativos por diseño (CHECK `≠ 0`) — el recálculo
  del monedero depende de esa semántica.
- Props `language?: "es"` repartidas por muchos componentes "por
  compatibilidad" sin efecto.
