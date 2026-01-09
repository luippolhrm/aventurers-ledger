-- Migración de tipos de tiendas antiguos a nuevos tipos D&D 2024
-- Este script mapea los tipos antiguos a los nuevos tipos alineados con D&D 2024

-- Mapear tipos antiguos a nuevos
UPDATE shops 
SET shop_type = CASE
  WHEN shop_type = 'inn' THEN 'tavern'
  WHEN shop_type = 'general' THEN 'general_store'
  WHEN shop_type = 'smith' THEN 'blacksmith'
  WHEN shop_type = 'jewelry' THEN 'magic_shop'
  WHEN shop_type = 'market' THEN 'trading_post'
  WHEN shop_type = 'atelier' THEN 'magic_shop'
  ELSE shop_type
END
WHERE shop_type IN ('inn', 'general', 'smith', 'jewelry', 'market', 'atelier');

-- Nota: Los tipos antiguos se mantienen en lib/texts.ts para compatibilidad
-- pero los nuevos tipos son los recomendados para nuevas tiendas

