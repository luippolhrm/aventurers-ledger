-- ============================================================================
-- SCRIPT 051: Agregar character_id a campaign_members (Híbrido: user_id + character_id)
-- ============================================================================
-- Purpose: Permitir que múltiples personajes del mismo usuario puedan estar
--          en la misma campaña. Mantiene user_id para compatibilidad.
-- ============================================================================

-- Agregar columna character_id (nullable inicialmente para migración)
ALTER TABLE public.campaign_members
ADD COLUMN IF NOT EXISTS character_id UUID REFERENCES characters(id) ON DELETE CASCADE;

-- Crear índice para mejor performance
CREATE INDEX IF NOT EXISTS idx_campaign_members_character ON public.campaign_members(character_id);

-- Migrar datos existentes: asignar el primer personaje de cada usuario
-- Solo si el usuario tiene personajes y el character_id es NULL
UPDATE public.campaign_members cm
SET character_id = (
  SELECT c.id
  FROM characters c
  WHERE c.user_id = cm.user_id
    AND c.archived = false
  ORDER BY c.created_at ASC
  LIMIT 1
)
WHERE cm.character_id IS NULL
  AND EXISTS (
    SELECT 1
    FROM characters c
    WHERE c.user_id = cm.user_id
      AND c.archived = false
  );

-- Eliminar el constraint UNIQUE anterior (campaign_id, user_id)
ALTER TABLE public.campaign_members
DROP CONSTRAINT IF EXISTS campaign_members_campaign_id_user_id_key;

-- Crear nuevo constraint UNIQUE que permite múltiples personajes del mismo usuario
-- en la misma campaña
ALTER TABLE public.campaign_members
ADD CONSTRAINT campaign_members_campaign_user_character_unique
UNIQUE (campaign_id, user_id, character_id);

-- Actualizar políticas RLS para considerar character_id
-- Primero eliminar políticas existentes que puedan causar problemas
DROP POLICY IF EXISTS "campaign_members_select_own" ON public.campaign_members;
DROP POLICY IF EXISTS "campaign_members_insert_own" ON public.campaign_members;
DROP POLICY IF EXISTS "campaign_members_delete_own" ON public.campaign_members;

-- Recrear políticas que consideran character_id
-- Los usuarios pueden ver sus propios miembros (por user_id)
CREATE POLICY "campaign_members_select_own"
  ON public.campaign_members FOR SELECT
  USING (user_id = auth.uid());

-- Los usuarios pueden insertar sus propios miembros (por user_id)
CREATE POLICY "campaign_members_insert_own"
  ON public.campaign_members FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Los usuarios pueden eliminar sus propios miembros (por user_id)
CREATE POLICY "campaign_members_delete_own"
  ON public.campaign_members FOR DELETE
  USING (user_id = auth.uid());

-- Actualizar la política de campaigns para considerar character_id
-- Primero eliminar la política existente
DROP POLICY IF EXISTS "campaigns_select_own_or_member" ON public.campaigns;

-- Recrear política que permite ver campañas donde el usuario es miembro
-- (ya sea por user_id o por character_id)
CREATE POLICY "campaigns_select_own_or_member"
  ON public.campaigns FOR SELECT
  USING (
    game_master_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.campaign_members
      WHERE campaign_members.campaign_id = campaigns.id
        AND campaign_members.user_id = auth.uid()
    )
  );

-- Verificar que la migración fue exitosa
SELECT 
  'campaign_members migration' AS status,
  COUNT(*) AS total_members,
  COUNT(character_id) AS members_with_character,
  COUNT(*) - COUNT(character_id) AS members_without_character
FROM public.campaign_members;

-- Mostrar políticas actualizadas
SELECT 'campaign_members policies' AS section, policyname, cmd
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'campaign_members'
ORDER BY policyname;

-- Mostrar constraints
SELECT 
  'campaign_members constraints' AS section,
  constraint_name,
  constraint_type
FROM information_schema.table_constraints
WHERE table_schema = 'public'
  AND table_name = 'campaign_members'
ORDER BY constraint_name;
