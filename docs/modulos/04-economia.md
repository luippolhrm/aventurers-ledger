# Módulo 04 — Economía

## Nombre y propósito

El dinero del personaje: monedero multi-divisa, movimientos (ingresos, gastos,
conversiones), conversor de monedas y transferencias entre personajes.

## Estado

✅ **Completo** — todas las operaciones funcionan. Matices: la transferencia no
es atómica a nivel de base de datos (dos updates separados), y las tasas de
conversión están duplicadas en dos servicios (ver hallazgos).

## Qué hace (perspectiva del usuario)

- Ver el saldo del personaje en las **5 divisas de D&D** (platino, oro, electro,
  plata, cobre) con el **total en oro** calculado.
- Añadir o quitar monedas (con descripción opcional).
- **Convertir** entre divisas con las tasas oficiales.
- Ver el **historial de movimientos** (añadidos, retiros, conversiones y
  compras, estas últimas con la tienda y ubicación donde ocurrieron).
- **Transferir** moneda a otro personaje (incluso de otro jugador), con
  validación de fondos y registro en ambos historiales.
- Conversor de monedas independiente (calculadora, sin tocar el monedero).

Dónde se usa: tabs del jugador en campaña (Monedero, Movimientos) y hub del
personaje; el conversor en el dashboard vía `?module=currency-converter`
(⚠️ sin enlace visible en la UI).

## Cómo funciona

### Tasas de conversión (oficiales D&D ✓)

Definidas en `CurrencyConverterService` como valor en cobre:
| Divisa | Valor en CP |
|---|---|
| PP (platino) | 1 000 |
| GP (oro) | 100 |
| EP (electro) | 50 |
| SP (plata) | 10 |
| CP (cobre) | 1 |

Conversión: `cantidad × tasa[origen] ÷ tasa[destino]`, pasando siempre por cobre.
Coinciden con PHB (1 PP = 10 GP; 1 EP = 5 SP; etc.).
⚠️ Las mismas tasas están **duplicadas inline** en
`WalletService.calculateTotalInCopper`.

### Monedero (`WalletService`)

- Se **crea automáticamente por trigger** al crear el personaje (en 0).
- `getWallet` usa una variante con reintento que crea el monedero si faltara.
- `total_wealth` lo calcula un **trigger de BD** en cada escritura — la app
  nunca lo escribe.

### Movimientos (`MovementService`) — flujo clave

1. El servicio **solo inserta la fila** en `movements` (tipo `add`, `remove` o
   `conversion`; en conversión usa el conversor para calcular `amount_to` y
   **rechaza convertir a la misma divisa**).
2. El **trigger de BD** `trigger_sync_movements_to_wallet` recalcula el monedero
   completo a partir del historial de movimientos.
3. Excepción: los movimientos tipo `purchase` NO disparan el recálculo — la
   compra actualiza el monedero directamente dentro de su transacción
   (ver [módulo 09](./09-comercio.md)).

Es decir: **el historial de movimientos es la fuente de verdad del saldo**
(salvo compras).

### Transferencias (`TransferService.createTransfer`)

1. Valida: UUIDs correctos, cantidad > 0, y que **el usuario autenticado sea
   dueño del personaje remitente** (`ensureCharacterOwner`).
2. Rechaza transferirse a uno mismo (también CHECK en BD).
3. Valida **saldo suficiente en la divisa concreta** (no convierte entre
   divisas para cubrir la transferencia).
4. Resta al remitente y suma al destinatario (crea el monedero del destinatario
   si no existiera) y registra la fila en `transfers`.
   ⚠️ Son **dos updates + un insert separados**, sin transacción de BD: un fallo
   a mitad podría dejar estado inconsistente.
5. El destinatario puede ser un personaje de **otro usuario** (transferencias
   entre jugadores); la lista de destinos usa `getAllCharacters`.

### Validaciones principales

| Regla | Dónde |
|---|---|
| Cantidad > 0 | servicio + CHECK BD (`transfers.amount > 0`) |
| No transferir al mismo personaje | servicio + CHECK BD |
| Fondos suficientes en la divisa | `TransferService` |
| Solo el dueño del remitente transfiere | `ensureCharacterOwner` + RLS |
| Divisas válidas PP/GP/EP/SP/CP | CHECKs en BD |
| Montos de movimiento ≠ 0 (negativos permitidos) | CHECK BD |

## Datos que usa

| Tabla | Rol |
|---|---|
| `wallets` | saldo por divisa + total_wealth (trigger) |
| `movements` | historial; fuente de verdad del saldo vía trigger de recálculo |
| `transfers` | registro de envíos entre personajes |

RLS: monedero y movimientos solo del dueño; transferencias visibles para
remitente y destinatario.

## Interacción con otros módulos

- **Personajes**: cada monedero pertenece 1:1 a un personaje.
- **Comercio**: el checkout deduce del monedero (RPC) y crea el movimiento
  `purchase` con tienda/ubicación.
- **NPCs**: la distribución de moneda del GM suma al monedero del jugador.

## Archivos involucrados

`components/features/wallet/wallet-view.tsx` (+ wrapper legacy
`components/wallet-manager.tsx`) · `components/movements.tsx` (legacy, vivo) ·
`components/finances.tsx` (⚠️ cadena muerta junto a
`features/finances/finances-view.tsx`) ·
`components/currency-exchange-card.tsx` (conversor) ·
`lib/application/services/wallet-service.ts` · `movement-service.ts` ·
`transfer-service.ts` · `currency-converter-service.ts` ·
`lib/infrastructure/repositories/wallet-repository.ts` ·
`movement-repository.ts` · `transfer-repository.ts` ·
migraciones `001, 003, 004, 005, 007, 008, 009, 010, 029, 030, 058, 062`
