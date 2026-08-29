-- ============================================================================
-- SCRIPT 058: Permitir búsqueda de campañas por código de invitación
-- ============================================================================
-- Purpose: Solucionar el problema donde nuevos usuarios no pueden unirse
--          a campañas usando códigos de invitación debido a políticas RLS.
--          La función RPC permite buscar el ID de una campaña por código
--          sin ser bloqueada por RLS, ya que usa SECURITY DEFINER.
-- ============================================================================

-- Función para buscar campaña por código de invitación
-- Retorna solo el ID necesario para unirse, sin exponer otros datos
-- Usa SECURITY DEFINER para bypasear RLS de forma segura
CREATE OR REPLACE FUNCTION find_campaign_id_by_invite_code(invite_code_param TEXT)
RETURNS UUID AS $$
DECLARE
  campaign_id_result UUID;
BEGIN
  SELECT id INTO campaign_id_result
  FROM campaigns
  WHERE invite_code = UPPER(TRIM(invite_code_param));
  
  RETURN campaign_id_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Otorgar permisos de ejecución a usuarios autenticados
GRANT EXECUTE ON FUNCTION find_campaign_id_by_invite_code(TEXT) TO authenticated;

-- ============================================================================
-- VERIFICACIÓN
-- ============================================================================
-- Verificar que la función existe
SELECT 
  'Función find_campaign_id_by_invite_code creada' as status,
  routine_name,
  routine_type,
  security_type
FROM information_schema.routines
WHERE routine_schema = 'public' 
  AND routine_name = 'find_campaign_id_by_invite_code';

-- ============================================================================
-- RESULTADO ESPERADO
-- ============================================================================
-- ✅ Función RPC creada para buscar campañas por código de invitación
-- ✅ Permisos otorgados a usuarios autenticados
-- ✅ Los usuarios ahora pueden buscar campañas por código sin ser miembros
-- ============================================================================

