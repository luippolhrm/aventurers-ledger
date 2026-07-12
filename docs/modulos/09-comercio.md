# Módulo 09 — Comercio (catálogo, carrito y checkout)

## Nombre y propósito

El flujo de compra del jugador: explorar el catálogo de una tienda, llenar un
carrito y pagar. La compra es **atómica**: dinero, stock, inventario e
historial cambian juntos o no cambia nada.

## Estado

🔶 **Parcial** — el flujo completo funciona de extremo a extremo. Brechas: el
**descuento racial nunca se aplica en la práctica** (la tubería existe pero
ninguna especie define datos de descuento), y el **historial de compras se
escribe pero ninguna pantalla lo muestra**.

## Qué hace (perspectiva del usuario)

- El jugador entra a una tienda desde el tab Mundo de su campaña
  (`/shop-items/[shopId]`), ve el catálogo (solo objetos con stock) con
  precios, rareza y detalles.
- Añade objetos al carrito, cambia cantidades, quita items o vacía el carrito.
  El carrito **persiste en BD** (uno por personaje+tienda).
- Al pagar: si todo es válido, se descuenta el dinero (deducción inteligente
  entre divisas), los objetos aparecen en su inventario, el stock de la tienda
  baja, se registra un movimiento "compra" con la tienda y ubicación, y el
  carrito se vacía.
- Si falta dinero o stock, la compra falla con mensaje claro y **no cambia
  nada**.

## Cómo funciona

### Quién puede comprar (`canCharacterPurchase`)
- **Los GM no pueden comprar** (regla explícita).
- El personaje debe estar inscrito como **role `player`** en la campaña a la
  que pertenece la tienda.
- Toda operación de carrito exige que el usuario autenticado sea **dueño del
  personaje** (`ensureCharacterOwner`).

### Precio y descuento racial
- Precio unitario: `Math.round(price_in_copper × multiplicador)`.
- Multiplicador: `1 − discount_percent/100`, leyendo
  `characters.shop_bonuses.discount_percent` (válido 0–99). Implementado
  **idéntico** en TS (`getShopPriceMultiplier`) y en la RPC de compra
  (`scripts/079_process_purchase_shop_discount.sql`), para que el total mostrado
  y el cobrado coincidan.
- ⚠️ **Inoperante hoy**: ninguna especie/rasgo asigna `shop_bonuses`
  (`getShopBonuses()` siempre devuelve `null`), así que el multiplicador es
  siempre 1. Ver hallazgos.

### Validación de checkout (`validateCheckout` — 7 pasos en TS)
1. No es GM.
2. El personaje existe.
3. La tienda existe.
4. Es jugador inscrito en la campaña de la tienda.
5. Carrito no vacío.
6. **Stock re-consultado** en el momento (evita carreras) y **el precio no
   cambió más del 10%** desde que se añadió al carrito.
7. Fondos suficientes (total del carrito vs monedero en cobre).

### Transacción de compra (RPC `process_purchase`, SECURITY DEFINER)

Única operación multi-tabla realmente atómica del sistema. En una transacción:
1. Valida carrito, monedero y stock por item (de nuevo, en BD).
2. Calcula el total con el descuento.
3. Descuenta stock (`UPDATE … WHERE quantity_available >= pedido` — falla si
   otro compró antes).
4. Inserta los objetos en el `inventory` del personaje.
5. Inserta una fila por item en `purchase_history` (precio unitario y total).
6. Deduce el monedero con `calculate_wallet_deduction` (prioriza gastar
   PP > GP > EP > SP > CP y recompone el cambio).
7. Inserta el movimiento `purchase` con descripción enriquecida
   "(Tienda, Ubicación)". Este tipo de movimiento **no** dispara el trigger de
   recálculo del monedero (el wallet ya quedó actualizado en la transacción).
8. Vacía el carrito.
Cualquier error → rollback completo y `{success:false, error}`.

### Validaciones principales

| Regla | Dónde |
|---|---|
| GM no compra | TS (`canCharacterPurchase`) |
| Solo dueño del personaje opera su carrito | `ensureCharacterOwner` + RLS |
| Carrito solo para personajes inscritos como player | RLS de `shopping_carts` |
| Stock suficiente | TS (paso 6) **y** RPC (doble validación) |
| Fondos suficientes | TS (paso 7) **y** RPC |
| Deriva de precio > 10% | TS |
| Un carrito por personaje+tienda; un item por carrito | UNIQUEs en BD |

## Datos que usa

| Tabla | Rol |
|---|---|
| `shopping_carts` / `shopping_cart_items` | carrito persistente |
| `shop_items` (lee/escribe) | catálogo y stock |
| `characters` (lee) | shop_bonuses para el descuento |
| `wallets` (escribe vía RPC) | pago |
| `inventory` (escribe vía RPC) | entrega de objetos |
| `purchase_history` (escribe vía RPC) | ⚠️ nadie la lee hoy |
| `movements` (escribe vía RPC) | movimiento tipo `purchase` con shop/location |

## Interacción con otros módulos

- **Mundo**: el catálogo es el de la tienda (módulo 06).
- **Personajes**: descuento por `shop_bonuses`; **Economía**: pago y movimiento;
  **Inventario**: entrega de objetos.
- **Campañas**: la inscripción como player habilita comprar.

## Archivos involucrados

`app/(app)/shop-items/[shopId]/page.tsx` (decide gestor GM vs catálogo
jugador) · `components/shop-catalog.tsx` · `components/shopping-cart.tsx` ·
`components/cart-item.tsx` · `hooks/use-shopping-cart.ts` ·
`components/features/world/shop-items-manager.tsx` (lado GM) ·
`lib/application/services/shopping-cart-service.ts` ·
`lib/infrastructure/repositories/shopping-cart-repository.ts` ·
`scripts/057_create_shopping_cart_tables.sql` ·
`scripts/059b_create_process_purchase_function.sql` (versión original) ·
`scripts/060_create_wallet_deduction_helper.sql` ·
`scripts/079_process_purchase_shop_discount.sql` (versión vigente) ·
⚠️ `lib/services/shopping-cart-service.ts` es un duplicado viejo **muerto**
