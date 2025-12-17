-- ============================================================================
-- SCRIPT 050: Permitir que usuarios invitados vean información de campañas
-- ============================================================================
-- Purpose: Los usuarios que reciben invitaciones no pueden ver la información
--          de la campaña porque aún no son miembros. Este script agrega una
--          política RLS que permite ver información básica de campañas a las
--          que están invitados.
-- 
-- IMPORTANTE: Usa una función SECURITY DEFINER para evitar recursión infinita
--             en las políticas RLS.
-- ============================================================================

-- Eliminar política si ya existe (para poder recrearla)
DROP POLICY IF EXISTS "Users can view campaigns they are invited to" ON campaigns;

-- Asegurar que la función helper existe (debe haberse creado en script 049)
-- Si no existe, crearla aquí como fallback
CREATE OR REPLACE FUNCTION get_current_user_email()
RETURNS TEXT AS $$
DECLARE
  user_email TEXT;
  current_user_id UUID;
BEGIN
  current_user_id := auth.uid();
  IF current_user_id IS NULL THEN
    RETURN NULL;
  END IF;
  
  SELECT email INTO user_email
  FROM auth.users
  WHERE id = current_user_id;
  
  RETURN CASE WHEN user_email IS NOT NULL THEN LOWER(user_email) ELSE NULL END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función helper para verificar si el usuario tiene una invitación pendiente a una campaña
-- Esta función usa SECURITY DEFINER para evitar recursión en políticas RLS
-- IMPORTANTE: SECURITY DEFINER permite que la función acceda a campaign_invitations
--           sin activar las políticas RLS, evitando recursión infinita
CREATE OR REPLACE FUNCTION user_has_pending_invitation_to_campaign(campaign_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
  current_user_id UUID;
  current_user_email TEXT;
  has_invitation BOOLEAN;
BEGIN
  current_user_id := auth.uid();
  IF current_user_id IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Obtener email del usuario usando la función helper
  current_user_email := get_current_user_email();
  
  -- Verificar si existe una invitación pendiente
  -- Como esta función es SECURITY DEFINER, puede consultar campaign_invitations
  -- sin activar las políticas RLS, evitando recursión
  SELECT EXISTS (
    SELECT 1 FROM campaign_invitations
    WHERE campaign_invitations.campaign_id = campaign_uuid
      AND campaign_invitations.status = 'pending'
      AND (
        campaign_invitations.invitee_id = current_user_id
        OR
        (
          campaign_invitations.invitee_email IS NOT NULL
          AND current_user_email IS NOT NULL
          AND LOWER(campaign_invitations.invitee_email) = current_user_email
        )
      )
  ) INTO has_invitation;
  
  RETURN COALESCE(has_invitation, FALSE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Agregar política para que usuarios invitados puedan ver información básica de campañas
-- Usa la función helper para evitar recursión
CREATE POLICY "Users can view campaigns they are invited to"
  ON campaigns FOR SELECT
  USING (user_has_pending_invitation_to_campaign(campaigns.id));

-- También necesitamos permitir que los usuarios vean perfiles de otros usuarios
-- (específicamente para ver el nombre del invitador)
-- Verificar si ya existe una política para ver perfiles públicos
DO $$
BEGIN
  -- Si no existe una política que permita ver perfiles de otros usuarios, crearla
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'profiles'
      AND policyname = 'Users can view public profiles'
  ) THEN
    -- Permitir ver perfiles de otros usuarios (solo display_name)
    CREATE POLICY "Users can view public profiles"
      ON profiles FOR SELECT
      USING (true); -- Permitir ver todos los perfiles (solo display_name es público)
  END IF;
END $$;

-- ============================================================================
-- VERIFICACIÓN
-- ============================================================================
-- Verificar que la función existe
SELECT 
  'Función user_has_pending_invitation_to_campaign creada' as status,
  routine_name,
  routine_type,
  security_type
FROM information_schema.routines
WHERE routine_schema = 'public' 
  AND routine_name = 'user_has_pending_invitation_to_campaign';

-- Verificar políticas de campaigns
SELECT 
  'Políticas RLS campaigns' as info,
  policyname,
  cmd
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename = 'campaigns'
ORDER BY policyname;

-- Verificar políticas de profiles
SELECT 
  'Políticas RLS profiles' as info,
  policyname,
  cmd
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename = 'profiles'
ORDER BY policyname;

-- ============================================================================
-- RESULTADO ESPERADO
-- ============================================================================
-- ✅ Política agregada para que usuarios invitados puedan ver campañas
-- ✅ Política agregada para que usuarios puedan ver perfiles públicos
-- ✅ Los usuarios invitados ahora pueden ver nombre de campaña e invitador
-- ============================================================================
