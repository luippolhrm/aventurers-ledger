-- ============================================================================
-- SCRIPT 048: Crear tabla campaign_invitations
-- ============================================================================
-- Purpose: Permitir que los GMs envíen invitaciones directas a jugadores
--          para unirse a campañas
-- ============================================================================

-- Crear tabla campaign_invitations
CREATE TABLE IF NOT EXISTS campaign_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  inviter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  invitee_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  invitee_email TEXT NOT NULL, -- Email del usuario a invitar
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'cancelled')),
  message TEXT, -- Mensaje opcional del GM
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ, -- Opcional: fecha de expiración
  CONSTRAINT valid_invitation CHECK (
    (invitee_id IS NOT NULL) OR (invitee_email IS NOT NULL)
  )
);

-- Crear índices para mejor performance
CREATE INDEX IF NOT EXISTS idx_campaign_invitations_campaign ON campaign_invitations(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_invitations_invitee ON campaign_invitations(invitee_id);
CREATE INDEX IF NOT EXISTS idx_campaign_invitations_inviter ON campaign_invitations(inviter_id);
CREATE INDEX IF NOT EXISTS idx_campaign_invitations_status ON campaign_invitations(status);
CREATE INDEX IF NOT EXISTS idx_campaign_invitations_email ON campaign_invitations(invitee_email);

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION update_campaign_invitations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_campaign_invitations_updated_at ON campaign_invitations;
CREATE TRIGGER trigger_update_campaign_invitations_updated_at
  BEFORE UPDATE ON campaign_invitations
  FOR EACH ROW
  EXECUTE FUNCTION update_campaign_invitations_updated_at();

-- Función para aceptar invitación automáticamente (ahora funciona con email también)
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

-- Habilitar RLS
ALTER TABLE campaign_invitations ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
-- Los usuarios pueden ver sus propias invitaciones (como invitado) por ID o email
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

-- Los GMs pueden ver invitaciones de sus campañas
CREATE POLICY "GMs can view campaign invitations"
  ON campaign_invitations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM campaigns
      WHERE campaigns.id = campaign_invitations.campaign_id
        AND campaigns.game_master_id = auth.uid()
    )
  );

-- Los GMs pueden crear invitaciones para sus campañas
CREATE POLICY "GMs can create invitations"
  ON campaign_invitations FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM campaigns
      WHERE campaigns.id = campaign_invitations.campaign_id
        AND campaigns.game_master_id = auth.uid()
        AND campaign_invitations.inviter_id = auth.uid()
    )
  );

-- Los GMs pueden actualizar/cancelar invitaciones de sus campañas
CREATE POLICY "GMs can update campaign invitations"
  ON campaign_invitations FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM campaigns
      WHERE campaigns.id = campaign_invitations.campaign_id
        AND campaigns.game_master_id = auth.uid()
    )
  );

-- Los usuarios invitados pueden aceptar/rechazar sus invitaciones (por ID o email)
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

-- Los GMs pueden eliminar invitaciones de sus campañas
CREATE POLICY "GMs can delete campaign invitations"
  ON campaign_invitations FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM campaigns
      WHERE campaigns.id = campaign_invitations.campaign_id
        AND campaigns.game_master_id = auth.uid()
    )
  );

-- ============================================================================
-- VERIFICACIÓN
-- ============================================================================
-- Verificar que la tabla se creó correctamente
SELECT 
  'Tabla campaign_invitations creada' as status,
  COUNT(*) as column_count
FROM information_schema.columns
WHERE table_name = 'campaign_invitations';

-- Verificar políticas RLS
SELECT 
  'Políticas RLS' as info,
  policyname,
  cmd
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename = 'campaign_invitations'
ORDER BY policyname;

-- ============================================================================
-- RESULTADO ESPERADO
-- ============================================================================
-- ✅ Tabla campaign_invitations creada con todas las columnas
-- ✅ 5 políticas RLS creadas
-- ============================================================================
