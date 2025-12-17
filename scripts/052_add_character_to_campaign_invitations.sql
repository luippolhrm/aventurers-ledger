-- ============================================================================
-- SCRIPT 052: Agregar character_id opcional a campaign_invitations
-- ============================================================================
-- Purpose: Permitir invitaciones a personajes específicos, manteniendo
--          compatibilidad con invitaciones por email.
-- ============================================================================

-- Agregar columna character_id (nullable - opcional)
ALTER TABLE public.campaign_invitations
ADD COLUMN IF NOT EXISTS character_id UUID REFERENCES characters(id) ON DELETE CASCADE;

-- Crear índice para mejor performance
CREATE INDEX IF NOT EXISTS idx_campaign_invitations_character ON public.campaign_invitations(character_id);

-- Actualizar el constraint existente para permitir character_id
-- Primero eliminar el constraint anterior
ALTER TABLE public.campaign_invitations
DROP CONSTRAINT IF EXISTS valid_invitation;

-- Crear nuevo constraint que permite:
-- - invitee_id O invitee_email (como antes)
-- - character_id es opcional (puede ser NULL para invitaciones por email)
ALTER TABLE public.campaign_invitations
ADD CONSTRAINT valid_invitation CHECK (
  (invitee_id IS NOT NULL) OR (invitee_email IS NOT NULL)
);

-- Asegurar que la función helper existe (debe estar creada por script 049)
-- Si no existe, crearla aquí
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

-- Actualizar políticas RLS para considerar character_id
-- Primero eliminar políticas existentes
DROP POLICY IF EXISTS "Users can view their invitations" ON public.campaign_invitations;
DROP POLICY IF EXISTS "Users can view invitations they sent" ON public.campaign_invitations;
DROP POLICY IF EXISTS "Users can respond to invitations" ON public.campaign_invitations;

-- Recrear políticas que consideran character_id
-- Los usuarios pueden ver invitaciones donde son el invitado (invitee_id o invitee_email)
-- Usando la función helper get_current_user_email() para evitar problemas de RLS
CREATE POLICY "Users can view their invitations"
  ON public.campaign_invitations FOR SELECT
  USING (
    (invitee_id = auth.uid())
    OR (
      invitee_email IS NOT NULL
      AND get_current_user_email() IS NOT NULL
      AND LOWER(invitee_email) = get_current_user_email()
    )
  );

-- Los usuarios pueden ver invitaciones que enviaron (inviter_id)
CREATE POLICY "Users can view invitations they sent"
  ON public.campaign_invitations FOR SELECT
  USING (inviter_id = auth.uid());

-- Los usuarios pueden actualizar invitaciones donde son el invitado
-- (para aceptar/rechazar)
CREATE POLICY "Users can respond to invitations"
  ON public.campaign_invitations FOR UPDATE
  USING (
    (invitee_id = auth.uid())
    OR (
      invitee_email IS NOT NULL
      AND get_current_user_email() IS NOT NULL
      AND LOWER(invitee_email) = get_current_user_email()
    )
  )
  WITH CHECK (
    (invitee_id = auth.uid())
    OR (
      invitee_email IS NOT NULL
      AND get_current_user_email() IS NOT NULL
      AND LOWER(invitee_email) = get_current_user_email()
    )
  );

-- Verificar que la migración fue exitosa
SELECT 
  'campaign_invitations migration' AS status,
  COUNT(*) AS total_invitations,
  COUNT(character_id) AS invitations_with_character,
  COUNT(*) - COUNT(character_id) AS invitations_without_character
FROM public.campaign_invitations;

-- Mostrar políticas actualizadas
SELECT 'campaign_invitations policies' AS section, policyname, cmd
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'campaign_invitations'
ORDER BY policyname;

-- Mostrar constraints
SELECT 
  'campaign_invitations constraints' AS section,
  constraint_name,
  constraint_type
FROM information_schema.table_constraints
WHERE table_schema = 'public'
  AND table_name = 'campaign_invitations'
ORDER BY constraint_name;
