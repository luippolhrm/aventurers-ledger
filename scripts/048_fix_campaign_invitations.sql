-- ============================================================================
-- SCRIPT 048 FIX: Corregir tabla campaign_invitations existente
-- ============================================================================
-- Purpose: Si ya ejecutaste el script 048 y hubo errores, este script corrige
--          la estructura de la tabla para usar solo email
-- ============================================================================

-- Eliminar columna invitee_username si existe
ALTER TABLE campaign_invitations 
DROP COLUMN IF EXISTS invitee_username;

-- Asegurar que invitee_email existe y es NOT NULL
DO $$
BEGIN
  -- Si invitee_email no existe, agregarlo
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'campaign_invitations' 
    AND column_name = 'invitee_email'
  ) THEN
    ALTER TABLE campaign_invitations 
    ADD COLUMN invitee_email TEXT;
  END IF;
  
  -- Hacer que invitee_email sea NOT NULL (si hay datos, primero actualizar)
  -- Por ahora lo dejamos nullable para evitar errores, pero la constraint lo manejará
END $$;

-- Eliminar constraint antigua si existe
ALTER TABLE campaign_invitations 
DROP CONSTRAINT IF EXISTS valid_invitation;

-- Crear constraint corregida
ALTER TABLE campaign_invitations 
ADD CONSTRAINT valid_invitation CHECK (
  (invitee_id IS NOT NULL) OR (invitee_email IS NOT NULL)
);

-- Eliminar índice de username si existe
DROP INDEX IF EXISTS idx_campaign_invitations_username;

-- Asegurar que existe índice de email
CREATE INDEX IF NOT EXISTS idx_campaign_invitations_email ON campaign_invitations(invitee_email);

-- Eliminar políticas RLS antiguas si existen
DROP POLICY IF EXISTS "Users can view their invitations" ON campaign_invitations;
DROP POLICY IF EXISTS "Users can respond to invitations" ON campaign_invitations;

-- Recrear políticas RLS corregidas
CREATE POLICY "Users can view their invitations"
  ON campaign_invitations FOR SELECT
  USING (
    invitee_id = auth.uid() 
    OR 
    (invitee_email IS NOT NULL AND EXISTS (
      SELECT 1 FROM auth.users 
      WHERE id = auth.uid() 
      AND LOWER(email) = LOWER(invitee_email)
    ))
  );

CREATE POLICY "Users can respond to invitations"
  ON campaign_invitations FOR UPDATE
  USING (
    invitee_id = auth.uid() 
    OR 
    (invitee_email IS NOT NULL AND EXISTS (
      SELECT 1 FROM auth.users 
      WHERE id = auth.uid() 
      AND LOWER(email) = LOWER(invitee_email)
    ))
  )
  WITH CHECK (
    invitee_id = auth.uid() 
    OR 
    (invitee_email IS NOT NULL AND EXISTS (
      SELECT 1 FROM auth.users 
      WHERE id = auth.uid() 
      AND LOWER(email) = LOWER(invitee_email)
    ))
  );

-- Actualizar función accept_campaign_invitation si es necesario
CREATE OR REPLACE FUNCTION accept_campaign_invitation(invitation_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  inv_record campaign_invitations%ROWTYPE;
  current_user_email TEXT;
BEGIN
  -- Obtener email del usuario actual
  SELECT email INTO current_user_email
  FROM auth.users
  WHERE id = auth.uid();
  
  -- Obtener la invitación
  SELECT * INTO inv_record
  FROM campaign_invitations
  WHERE id = invitation_id
    AND status = 'pending';
  
  -- Verificar que existe
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;
  
  -- Verificar que el usuario invitado es el actual (por ID o email)
  IF inv_record.invitee_id IS NOT NULL AND inv_record.invitee_id != auth.uid() THEN
    RETURN FALSE;
  END IF;
  
  IF inv_record.invitee_email IS NOT NULL AND LOWER(inv_record.invitee_email) != LOWER(current_user_email) THEN
    RETURN FALSE;
  END IF;
  
  -- Verificar que no es miembro ya
  IF EXISTS (
    SELECT 1 FROM campaign_members
    WHERE campaign_id = inv_record.campaign_id
      AND user_id = auth.uid()
  ) THEN
    -- Marcar como aceptada pero no agregar miembro (ya es miembro)
    UPDATE campaign_invitations
    SET status = 'accepted', invitee_id = auth.uid()
    WHERE id = invitation_id;
    RETURN TRUE;
  END IF;
  
  -- Agregar como miembro
  INSERT INTO campaign_members (campaign_id, user_id, role)
  VALUES (inv_record.campaign_id, auth.uid(), 'player')
  ON CONFLICT (campaign_id, user_id) DO NOTHING;
  
  -- Marcar invitación como aceptada y actualizar invitee_id si estaba vacío
  UPDATE campaign_invitations
  SET status = 'accepted', invitee_id = auth.uid()
  WHERE id = invitation_id;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- VERIFICACIÓN
-- ============================================================================
-- Verificar estructura de la tabla
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'campaign_invitations'
ORDER BY ordinal_position;

-- Verificar constraint
SELECT 
  constraint_name,
  check_clause
FROM information_schema.check_constraints
WHERE constraint_name = 'valid_invitation';

-- Verificar políticas RLS
SELECT 
  policyname,
  cmd
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename = 'campaign_invitations'
ORDER BY policyname;

-- ============================================================================
-- RESULTADO ESPERADO
-- ============================================================================
-- ✅ Columna invitee_username eliminada (si existía)
-- ✅ Columna invitee_email existe
-- ✅ Constraint valid_invitation solo verifica invitee_id o invitee_email
-- ✅ Políticas RLS actualizadas para funcionar con email
-- ============================================================================
