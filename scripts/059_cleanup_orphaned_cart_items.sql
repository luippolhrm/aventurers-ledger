-- ============================================================================
-- SCRIPT 059: Limpiar items residuales en carritos
-- ============================================================================
-- Purpose: Eliminar items huérfanos de shopping_cart_items que referencian
--          shop_items eliminados o de tiendas incorrectas
-- ============================================================================
-- WARNING: Este script ELIMINA datos. Ejecutar el script 058 primero para
--          ver qué se va a eliminar.
-- ============================================================================

-- LIMPIAR: Eliminar items del carrito que referencian shop_items eliminados
DELETE FROM shopping_cart_items
WHERE shop_item_id IN (
  SELECT sci.shop_item_id
  FROM shopping_cart_items sci
  LEFT JOIN shop_items si ON si.id = sci.shop_item_id
  WHERE si.id IS NULL
);

-- LIMPIAR: Eliminar items del carrito que pertenecen a otra tienda
DELETE FROM shopping_cart_items
WHERE id IN (
  SELECT sci.id
  FROM shopping_cart_items sci
  JOIN shopping_carts sc ON sc.id = sci.cart_id
  JOIN shop_items si ON si.id = sci.shop_item_id
  WHERE sc.shop_id != si.shop_id
);

-- LIMPIAR: Eliminar shop_items que no tienen una tienda válida
-- (Solo items creados por métodos distintos al manual - sin source='manual')
DELETE FROM shop_items
WHERE shop_id NOT IN (SELECT id FROM shops)
  AND (source IS NULL OR source != 'manual');

-- Verificar limpieza: Debería mostrar 0 para todos los casos
SELECT 
  'Items con shop_item eliminado' as issue_type,
  COUNT(*) as remaining_count
FROM shopping_cart_items sci
LEFT JOIN shop_items si ON si.id = sci.shop_item_id
WHERE si.id IS NULL

UNION ALL

SELECT 
  'Items de tienda incorrecta' as issue_type,
  COUNT(*) as remaining_count
FROM shopping_cart_items sci
JOIN shopping_carts sc ON sc.id = sci.cart_id
JOIN shop_items si ON si.id = sci.shop_item_id
WHERE sc.shop_id != si.shop_id

UNION ALL

SELECT 
  'Shop_items sin tienda válida (no manual)' as issue_type,
  COUNT(*) as remaining_count
FROM shop_items si
LEFT JOIN shops s ON s.id = si.shop_id
WHERE s.id IS NULL
  AND (si.source IS NULL OR si.source != 'manual');

