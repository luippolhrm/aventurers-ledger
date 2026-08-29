-- ============================================================================
-- SCRIPT 058: Diagnosticar items residuales en carritos
-- ============================================================================
-- Purpose: Identificar items huérfanos en shopping_cart_items que referencian
--          shop_items eliminados o de tiendas incorrectas
-- ============================================================================
-- Usage: Ejecutar este script primero para ver qué items problemáticos existen
--        antes de ejecutar el script de limpieza (059)
-- ============================================================================

-- 1. DETECTAR: Items del carrito que referencian shop_items que no existen
SELECT 
  'Items con shop_item eliminado' as issue_type,
  sci.id as cart_item_id,
  sci.cart_id,
  sci.shop_item_id as orphaned_shop_item_id,
  sc.character_id,
  sc.shop_id as cart_shop_id,
  sci.created_at
FROM shopping_cart_items sci
JOIN shopping_carts sc ON sc.id = sci.cart_id
LEFT JOIN shop_items si ON si.id = sci.shop_item_id
WHERE si.id IS NULL
ORDER BY sci.created_at DESC;

-- 2. DETECTAR: Items del carrito que referencian shop_items de otra tienda
SELECT 
  'Items de tienda incorrecta' as issue_type,
  sci.id as cart_item_id,
  sci.cart_id,
  sci.shop_item_id,
  sc.shop_id as cart_shop_id,
  si.shop_id as item_shop_id,
  sc.character_id,
  si.item_name
FROM shopping_cart_items sci
JOIN shopping_carts sc ON sc.id = sci.cart_id
JOIN shop_items si ON si.id = sci.shop_item_id
WHERE sc.shop_id != si.shop_id
ORDER BY sci.created_at DESC;

-- 3. DETECTAR: Shop_items que no tienen una tienda válida
SELECT 
  'Shop_items sin tienda válida' as issue_type,
  si.id as shop_item_id,
  si.shop_id,
  si.item_name,
  s.id as shop_exists,
  si.created_at
FROM shop_items si
LEFT JOIN shops s ON s.id = si.shop_id
WHERE s.id IS NULL
ORDER BY si.created_at DESC;

-- 4. RESUMEN: Contar items problemáticos
SELECT 
  'Items con shop_item eliminado' as issue_type,
  COUNT(*) as count
FROM shopping_cart_items sci
LEFT JOIN shop_items si ON si.id = sci.shop_item_id
WHERE si.id IS NULL

UNION ALL

SELECT 
  'Items de tienda incorrecta' as issue_type,
  COUNT(*) as count
FROM shopping_cart_items sci
JOIN shopping_carts sc ON sc.id = sci.cart_id
JOIN shop_items si ON si.id = sci.shop_item_id
WHERE sc.shop_id != si.shop_id

UNION ALL

SELECT 
  'Shop_items sin tienda válida' as issue_type,
  COUNT(*) as count
FROM shop_items si
LEFT JOIN shops s ON s.id = si.shop_id
WHERE s.id IS NULL;

