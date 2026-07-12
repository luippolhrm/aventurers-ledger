# Migraciones SQL — Orden canónico y política

Este directorio contiene las migraciones de la base de datos (Supabase/Postgres).
**No hay runner automático**: se aplican manualmente (editor SQL de Supabase o CLI).

## Orden de aplicación

**Aplicar todos los `*.sql` de este directorio en orden alfabético de nombre de archivo.**
El orden alfabético ES el orden canónico: los sufijos `b`/`c` (p. ej. `048b_...`)
intercalan scripts entre dos números sin renumerar el resto, y ordenan correctamente
después de su número base (`048_... → 048b_... → 049_...`).

En una base de datos nueva basta con eso; no hay pasos manuales intermedios.

## Historia: resolución de numeración duplicada (julio 2026)

Históricamente hubo números repetidos. Se resolvió renombrando el archivo **más
reciente** de cada colisión, preservando el orden cronológico en que se aplicaron
a la base de datos real:

| Nombre anterior | Nombre actual |
|---|---|
| `025_disable_movements_rls.sql` | `025b_disable_movements_rls.sql` |
| `047_cleanup_duplicate_usernames.sql` | `047b_cleanup_duplicate_usernames.sql` |
| `048_fix_campaign_invitations.sql` | `048b_fix_campaign_invitations.sql` |
| `054_fix_campaign_members_visibility.sql` | `054b_fix_campaign_members_visibility.sql` |
| `058_fix_campaign_invite_code_search.sql` | `058b_fix_campaign_invite_code_search.sql` |
| `058_normalize_campaign_members_roles.sql` | `058c_normalize_campaign_members_roles.sql` |
| `059_create_process_purchase_function.sql` | `059b_create_process_purchase_function.sql` |
| `076_process_purchase_shop_discount.sql` | `079_process_purchase_shop_discount.sql` |
| `083_add_weapon_properties_and_range.sql` | `084_add_weapon_properties_and_range.sql` |

Notas:
- `079` ocupa un hueco que estaba libre (no existía `079`) y debe ejecutarse después
  de `059b`/`060` porque reemplaza la función `process_purchase` con la versión que
  aplica el descuento de tienda.
- Los huecos restantes (`037`, `055`, `056`, `061`, `080`) son normales: corresponden a
  scripts movidos a `diagnostics/` o números nunca usados. No hay que rellenarlos.

## `diagnostics/`

Scripts de **solo lectura** para verificación y depuración (no son migraciones,
no se aplican en producción):

- `037_verificar_fase1.sql` — verificación de la fase 1 del esquema
- `055_verify_campaign_members_function.sql` — verificación de `get_campaign_members`
- `056_find_null_character_ids.sql` — búsqueda de datos inconsistentes
- `058_diagnose_orphaned_cart_items.sql` — diagnóstico de items de carrito huérfanos
- `061_test_process_purchase.sql` — casos de prueba de `process_purchase`
- `debug_wallet_issue.sql` — depuración de un problema histórico de wallets

## Política para nuevos scripts

1. **Número nuevo = máximo actual + 1** (hoy el máximo es `084`). Nunca reutilizar
   ni rellenar huecos.
2. Un cambio = un script. Nombre descriptivo en `snake_case`:
   `NNN_verbo_objeto.sql` (p. ej. `085_add_spell_slots_table.sql`).
3. Los scripts deben ser **idempotentes** cuando sea posible
   (`CREATE OR REPLACE`, `IF NOT EXISTS`, `DROP ... IF EXISTS`).
4. Scripts de diagnóstico/prueba van a `diagnostics/`, no a la raíz.
5. Cabecera comentada indicando qué hace y, si aplica, qué script reemplaza.
