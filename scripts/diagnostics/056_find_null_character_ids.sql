-- ============================================================================
-- SCRIPT 056: Encontrar registros de campaign_members con character_id NULL
-- ============================================================================
-- Este script ayuda a identificar registros problemáticos donde un player
-- tiene character_id NULL cuando debería tener un valor.
-- ============================================================================

-- Buscar todos los miembros player que tienen character_id NULL
SELECT 
  'Players con character_id NULL' AS tipo_problema,
  cm.id AS member_id,
  cm.campaign_id,
  cm.user_id,
  cm.character_id,
  cm.role,
  cm.joined_at,
  c.name AS campaign_name,
  p.display_name AS user_name
FROM public.campaign_members cm
LEFT JOIN public.campaigns c ON c.id = cm.campaign_id
LEFT JOIN public.profiles p ON p.id = cm.user_id
WHERE cm.role = 'player'
  AND cm.character_id IS NULL
ORDER BY cm.joined_at DESC;

-- Contar cuántos hay
SELECT 
  'Resumen' AS tipo,
  COUNT(*) AS total_players_sin_character_id
FROM public.campaign_members
WHERE role = 'player'
  AND character_id IS NULL;

-- Mostrar también los GMs (que SÍ deben tener character_id NULL)
SELECT 
  'GMs (character_id NULL es correcto)' AS tipo,
  cm.id AS member_id,
  cm.campaign_id,
  cm.user_id,
  cm.character_id,
  cm.role,
  c.name AS campaign_name,
  p.display_name AS user_name
FROM public.campaign_members cm
LEFT JOIN public.campaigns c ON c.id = cm.campaign_id
LEFT JOIN public.profiles p ON p.id = cm.user_id
WHERE cm.role = 'game_master'
ORDER BY cm.joined_at DESC;

-- Mostrar todos los players con character_id (para comparar)
SELECT 
  'Players CON character_id (correcto)' AS tipo,
  cm.id AS member_id,
  cm.campaign_id,
  cm.user_id,
  cm.character_id,
  cm.role,
  c.name AS campaign_name,
  p.display_name AS user_name,
  ch.name AS character_name
FROM public.campaign_members cm
LEFT JOIN public.campaigns c ON c.id = cm.campaign_id
LEFT JOIN public.profiles p ON p.id = cm.user_id
LEFT JOIN public.characters ch ON ch.id = cm.character_id
WHERE cm.role = 'player'
  AND cm.character_id IS NOT NULL
ORDER BY cm.joined_at DESC
LIMIT 10;
